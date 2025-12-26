import asyncio
from typing import Any

from app.models.api_keys import APIKeys
from app.models.translation import (
    EasyTranslateRequest,
    EasyTranslateResponse,
    VibeTranslateRequest,
    VibeTranslateResponse,
    SpecTranslateRequest,
    SpecTranslateResponse,
    ScoredEngineResult,
    TranslationScore,
    TranslationDecision,
)
from app.engines.openai_engine import OpenAIEngine
from app.engines.anthropic_engine import AnthropicEngine
from app.engines.base import TranslationResult


class TranslationService:
    """翻译服务"""

    def __init__(self, api_keys: APIKeys):
        self.api_keys = api_keys

    def _get_engine(self, engine_id: str):
        """获取引擎实例"""
        if engine_id == "openai":
            if not self.api_keys.openai_key:
                raise ValueError("OpenAI API key is required")
            return OpenAIEngine(self.api_keys.openai_key)
        elif engine_id == "anthropic":
            if not self.api_keys.anthropic_key:
                raise ValueError("Anthropic API key is required")
            return AnthropicEngine(self.api_keys.anthropic_key)
        else:
            raise ValueError(f"Unknown engine: {engine_id}")

    async def easy_translate(
        self, request: EasyTranslateRequest
    ) -> EasyTranslateResponse:
        """简易翻译"""
        engine = self._get_engine(request.engine)

        options = {}
        if request.prompt:
            options["prompt"] = request.prompt

        result = await engine.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            options=options,
        )

        if not result.success:
            raise Exception(result.error or "Translation failed")

        return EasyTranslateResponse(
            translated_text=result.text,
            source_lang=result.source_lang,
            target_lang=result.target_lang,
            engine=request.engine,
        )

    async def vibe_translate(
        self, request: VibeTranslateRequest
    ) -> VibeTranslateResponse:
        """氛围翻译 - 多引擎并行 + 评分"""
        # 并行执行所有引擎的翻译
        tasks = []
        for engine_id in request.engines:
            try:
                engine = self._get_engine(engine_id)
                tasks.append(self._translate_with_engine(engine, request))
            except ValueError:
                # 如果引擎不可用，跳过
                continue

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 处理结果
        scored_results: list[ScoredEngineResult] = []
        for i, result in enumerate(results):
            engine_id = request.engines[i] if i < len(request.engines) else "unknown"
            if isinstance(result, Exception):
                scored_results.append(
                    ScoredEngineResult(
                        engine_id=engine_id,
                        engine_name=engine_id,
                        translated_text="",
                        success=False,
                        error=str(result),
                    )
                )
            elif isinstance(result, ScoredEngineResult):
                scored_results.append(result)

        # 使用 Judge LLM 评分
        if self.api_keys.openai_key:
            scored_results = await self._judge_translations(
                request.text, request.intent, scored_results
            )

        # 找出最佳结果
        best_result = None
        if scored_results:
            successful_results = [r for r in scored_results if r.success and r.score]
            if successful_results:
                best_result = max(
                    successful_results, key=lambda x: x.score.overall if x.score else 0
                )

        return VibeTranslateResponse(
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            intent=request.intent,
            results=scored_results,
            best_result=best_result,
        )

    async def _translate_with_engine(
        self, engine, request: VibeTranslateRequest
    ) -> ScoredEngineResult:
        """使用指定引擎翻译"""
        result = await engine.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )

        return ScoredEngineResult(
            engine_id=engine.id,
            engine_name=engine.name,
            translated_text=result.text,
            success=result.success,
            error=result.error,
        )

    async def _judge_translations(
        self, source_text: str, intent: str, results: list[ScoredEngineResult]
    ) -> list[ScoredEngineResult]:
        """使用 Judge LLM 评分"""
        judge_engine = OpenAIEngine(self.api_keys.openai_key)

        for result in results:
            if not result.success:
                continue

            prompt = f"""请评估以下翻译的质量。

原文: {source_text}
翻译意图: {intent}
翻译结果: {result.translated_text}

请从以下维度评分（0-10分）：
1. 准确性 (Accuracy): 语义是否准确传达
2. 流畅度 (Fluency): 目标语言是否自然流畅
3. 风格匹配 (Style Match): 是否符合翻译意图
4. 术语一致性 (Terminology): 专业术语处理是否恰当

请以JSON格式返回：
{{"accuracy": 分数, "fluency": 分数, "style_match": 分数, "terminology": 分数, "comment": "简短评价"}}"""

            try:
                judge_result = await judge_engine.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a translation quality evaluator. Return only valid JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"},
                )

                import json

                scores = json.loads(judge_result.choices[0].message.content or "{}")

                overall = (
                    scores.get("accuracy", 5)
                    + scores.get("fluency", 5)
                    + scores.get("style_match", 5)
                    + scores.get("terminology", 5)
                ) / 4

                result.score = TranslationScore(
                    accuracy=scores.get("accuracy", 5),
                    fluency=scores.get("fluency", 5),
                    style_match=scores.get("style_match", 5),
                    terminology=scores.get("terminology", 5),
                    overall=overall,
                    comment=scores.get("comment"),
                )
            except Exception:
                # 评分失败时使用默认评分
                result.score = TranslationScore(
                    accuracy=5,
                    fluency=5,
                    style_match=5,
                    terminology=5,
                    overall=5,
                )

        return results

    async def spec_translate(
        self, request: SpecTranslateRequest
    ) -> SpecTranslateResponse:
        """规范翻译 - 基于蓝图的翻译"""
        engine = self._get_engine(request.engine)

        # 构建基于蓝图的提示词
        blueprint_prompt = self._build_blueprint_prompt(request.blueprint)

        result = await engine.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            options={"prompt": blueprint_prompt},
        )

        if not result.success:
            raise Exception(result.error or "Translation failed")

        # 生成翻译决策说明
        decisions = self._generate_decisions(request.blueprint)

        return SpecTranslateResponse(
            translated_text=result.text,
            source_lang=result.source_lang,
            target_lang=result.target_lang,
            blueprint_applied=request.blueprint,
            decisions=decisions,
        )

    def _build_blueprint_prompt(self, blueprint) -> str:
        """根据蓝图构建提示词"""
        parts = []

        # 翻译理论
        theory = blueprint.theory
        if theory.get("primary") == "equivalence":
            parts.append("Follow Equivalence Theory - prioritize meaning equivalence over form")
        elif theory.get("primary") == "functionalism":
            parts.append("Follow Functionalism/Skopos Theory - focus on the purpose of the translation")
        elif theory.get("primary") == "dts":
            parts.append("Follow Descriptive Translation Studies approach")

        # 翻译方法
        method = blueprint.method
        pref = method.get("preference", "literal")
        weight = method.get("weight", 0.5)
        if pref == "literal":
            parts.append(f"Use literal translation approach (weight: {weight})")
        elif pref == "free":
            parts.append(f"Use free translation approach (weight: {weight})")
        elif pref == "adaptation":
            parts.append(f"Use adaptation approach (weight: {weight})")

        # 翻译策略
        strategy = blueprint.strategy
        approach = strategy.get("approach", "domestication")
        weight = strategy.get("weight", 0.5)
        if approach == "domestication":
            parts.append(f"Apply domestication strategy - make it natural for target readers (weight: {weight})")
        else:
            parts.append(f"Apply foreignization strategy - preserve source culture elements (weight: {weight})")

        # 额外上下文
        if blueprint.context:
            parts.append(f"Additional context: {blueprint.context}")

        return "\n".join(parts)

    def _generate_decisions(self, blueprint) -> list[TranslationDecision]:
        """生成翻译决策说明"""
        decisions = []

        decisions.append(
            TranslationDecision(
                aspect="理论框架",
                decision=blueprint.theory.get("primary", "equivalence"),
                rationale="基于所选理论框架指导翻译方向",
            )
        )

        decisions.append(
            TranslationDecision(
                aspect="翻译方法",
                decision=blueprint.method.get("preference", "literal"),
                rationale=f"方法倾向权重: {blueprint.method.get('weight', 0.5)}",
            )
        )

        decisions.append(
            TranslationDecision(
                aspect="翻译策略",
                decision=blueprint.strategy.get("approach", "domestication"),
                rationale=f"策略应用权重: {blueprint.strategy.get('weight', 0.5)}",
            )
        )

        return decisions
