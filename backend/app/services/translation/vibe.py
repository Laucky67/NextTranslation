"""氛围翻译服务"""

import asyncio
import json
import re
from typing import Any

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from app.models.translation import (
    VibeTranslateRequest,
    VibeTranslateResponse,
    ScoredEngineResult,
    TranslationScore,
)
from app.services.translation.base import BaseTranslationService
from app.dependencies import EngineConfig
from app.llm_debug import log_ai_sdk_params
from app.prompts.vibe import build_vibe_judge_prompt, build_vibe_judge_system_prompt


class VibeTranslationService(BaseTranslationService):
    """氛围翻译服务

    氛围翻译模式：多引擎并行翻译 + AI 评分推荐最佳结果
    特点：
    1. 并行调用多个翻译引擎
    2. 使用 Judge LLM 对翻译结果评分
    3. 根据翻译意图(intent)选择最佳翻译
    """

    async def translate(
        self,
        request: VibeTranslateRequest,
        engine_configs: list[EngineConfig],
        judge_config: EngineConfig | None = None,
    ) -> VibeTranslateResponse:
        """执行氛围翻译

        Args:
            request: 翻译请求
            engine_configs: 多个引擎配置列表
            judge_config: 用于评分的引擎配置（默认使用第一个引擎）

        Returns:
            包含所有引擎结果和最佳推荐的响应
        """
        # 并行执行所有引擎的翻译
        tasks = []
        for i, config in enumerate(engine_configs):
            engine_id = request.engines[i] if i < len(request.engines) else f"engine_{i}"
            tasks.append(self._translate_with_config(config, engine_id, request))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 处理结果
        scored_results: list[ScoredEngineResult] = []
        for i, result in enumerate(results):
            engine_id = request.engines[i] if i < len(request.engines) else f"engine_{i}"
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
        judge = judge_config or self._find_judge_config(engine_configs)
        if judge:
            judged = await self._judge_and_synthesize(judge, request.text, request.intent, scored_results)
            scored_results = judged["results"]
            best_result = judged["best_result"]
            synthesized_translation = judged["synthesized_translation"]
            synthesis_rationale = judged["synthesis_rationale"]
        else:
            best_result = self._find_best_result(scored_results)
            synthesized_translation = None
            synthesis_rationale = None

        return VibeTranslateResponse(
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            intent=request.intent,
            results=scored_results,
            best_result=best_result,
            synthesized_translation=synthesized_translation,
            synthesis_rationale=synthesis_rationale,
        )

    async def translate_stream(
        self,
        request: VibeTranslateRequest,
        engine_configs: list[EngineConfig],
        judge_config: EngineConfig | None = None,
    ):
        async def run_one(engine_id: str, config: EngineConfig):
            try:
                result = await self._translate_with_config(config, engine_id, request)
            except Exception as e:
                result = ScoredEngineResult(
                    engine_id=engine_id,
                    engine_name=engine_id,
                    translated_text="",
                    success=False,
                    error=str(e),
                )
            return engine_id, result

        tasks: list[asyncio.Task[tuple[str, ScoredEngineResult]]] = []
        for i, config in enumerate(engine_configs):
            engine_id = request.engines[i] if i < len(request.engines) else f"engine_{i}"
            tasks.append(asyncio.create_task(run_one(engine_id, config)))

        results: list[ScoredEngineResult] = []
        for task in asyncio.as_completed(tasks):
            _, r = await task
            results.append(r)
            yield ("partial", r)

        judge = judge_config or self._find_judge_config(engine_configs)
        if judge:
            judged = await self._judge_and_synthesize(judge, request.text, request.intent, results)
            response = VibeTranslateResponse(
                source_lang=request.source_lang,
                target_lang=request.target_lang,
                intent=request.intent,
                results=judged["results"],
                best_result=judged["best_result"],
                synthesized_translation=judged["synthesized_translation"],
                synthesis_rationale=judged["synthesis_rationale"],
            )
        else:
            response = VibeTranslateResponse(
                source_lang=request.source_lang,
                target_lang=request.target_lang,
                intent=request.intent,
                results=results,
                best_result=self._find_best_result(results),
            )

        yield ("final", response)

    async def _translate_with_config(
        self,
        config: EngineConfig,
        engine_id: str,
        request: VibeTranslateRequest,
    ) -> ScoredEngineResult:
        """使用指定配置翻译"""
        engine = self.create_engine(config)

        result = await engine.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )

        return ScoredEngineResult(
            engine_id=engine_id,
            engine_name=config.model or config.channel,
            translated_text=result.text,
            success=result.success,
            error=result.error,
        )

    def _find_judge_config(self, configs: list[EngineConfig]) -> EngineConfig | None:
        """找到可用于评分的引擎配置（优先 OpenAI，其次第一个）"""
        for config in configs:
            if config.channel == "openai":
                return config
        return configs[0] if configs else None

    def _find_best_result(
        self, results: list[ScoredEngineResult]
    ) -> ScoredEngineResult | None:
        """找出评分最高的结果"""
        successful_results = [r for r in results if r.success and r.score]
        if not successful_results:
            return None
        return max(successful_results, key=lambda x: x.score.overall if x.score else 0)

    async def _judge_and_synthesize(
        self,
        judge_config: EngineConfig,
        source_text: str,
        intent: str,
        results: list[ScoredEngineResult],
    ) -> dict[str, Any]:
        prompt = build_vibe_judge_prompt(source_text=source_text, intent=intent, results=results)
        scores_payload = await self._score_with_judge(judge_config, prompt, operation="judge_vibe")

        score_list = scores_payload.get("scores", [])
        final = scores_payload.get("final", {}) if isinstance(scores_payload.get("final"), dict) else {}

        scores_by_engine: dict[str, dict[str, Any]] = {}
        if isinstance(score_list, list):
            for item in score_list:
                if not isinstance(item, dict):
                    continue
                engine_id = str(item.get("engine_id", "")).strip()
                if not engine_id:
                    continue
                scores_by_engine[engine_id] = item

        for r in results:
            if not r.success:
                continue
            score_item = scores_by_engine.get(r.engine_id)
            if not isinstance(score_item, dict):
                continue
            accuracy = self._to_score(score_item.get("accuracy"))
            fluency = self._to_score(score_item.get("fluency"))
            style_match = self._to_score(score_item.get("style_match"))
            terminology = self._to_score(score_item.get("terminology"))
            overall = (accuracy + fluency + style_match + terminology) / 4
            comment = score_item.get("comment")
            if isinstance(comment, str) and len(comment) > 999:
                comment = comment[:999]
            r.score = TranslationScore(
                accuracy=accuracy,
                fluency=fluency,
                style_match=style_match,
                terminology=terminology,
                overall=overall,
                comment=comment if isinstance(comment, str) else None,
            )

        synthesized_translation = None
        if isinstance(final.get("translation"), str) and final.get("translation").strip():
            synthesized_translation = final.get("translation").strip()
        synthesis_rationale = None
        if isinstance(final.get("rationale"), str) and final.get("rationale").strip():
            synthesis_rationale = final.get("rationale").strip()[:999]

        final_comment = final.get("comment")
        if isinstance(final_comment, str) and len(final_comment) > 999:
            final_comment = final_comment[:999]

        final_overall = self._to_score(final.get("overall"))
        best_result = ScoredEngineResult(
            engine_id="judge",
            engine_name=f"{judge_config.channel}:{judge_config.model or ''}".strip(":"),
            translated_text=synthesized_translation or "",
            success=True,
            score=TranslationScore(
                accuracy=final_overall,
                fluency=final_overall,
                style_match=final_overall,
                terminology=final_overall,
                overall=final_overall,
                comment=final_comment if isinstance(final_comment, str) else None,
            ),
        )

        return {
            "results": results,
            "best_result": best_result,
            "synthesized_translation": synthesized_translation,
            "synthesis_rationale": synthesis_rationale,
        }

    async def _score_with_judge(
        self, judge_config: EngineConfig, prompt: str, *, operation: str
    ) -> dict[str, Any]:
        if judge_config.channel == "openai":
            return await self._score_with_openai(judge_config, prompt, operation=operation)
        if judge_config.channel == "anthropic":
            return await self._score_with_anthropic(judge_config, prompt, operation=operation)
        return {}

    async def _score_with_openai(self, judge_config: EngineConfig, prompt: str, *, operation: str) -> dict[str, Any]:
        client = AsyncOpenAI(
            api_key=judge_config.api_key,
            base_url=judge_config.base_url if judge_config.base_url else None,
        )
        system = build_vibe_judge_system_prompt()
        params = {
            "model": judge_config.model or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
        log_ai_sdk_params("openai", params)
        judge_result = await client.chat.completions.create(**params)
        content = judge_result.choices[0].message.content or ""
        return self._safe_parse_json_object(content)

    async def _score_with_anthropic(
        self, judge_config: EngineConfig, prompt: str, *, operation: str
    ) -> dict[str, Any]:
        client = AsyncAnthropic(
            api_key=judge_config.api_key,
            base_url=judge_config.base_url if judge_config.base_url else None,
        )
        system = build_vibe_judge_system_prompt()
        params = {
            "model": judge_config.model or "claude-sonnet-4-20250514",
            "max_tokens": 2048,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }
        log_ai_sdk_params("anthropic", params)
        response = await client.messages.create(**params)
        text = ""
        if response.content:
            text = "".join(getattr(block, "text", "") for block in response.content)
        return self._safe_parse_json_object(text)

    def _safe_parse_json_object(self, text: str) -> dict[str, Any]:
        raw = (text or "").strip()
        if not raw:
            return {}

        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            pass

        # 兼容代码块/前后缀文本，尽量截取第一个 JSON 对象
        raw = re.sub(r"^```(?:json)?\\s*|\\s*```$", "", raw, flags=re.IGNORECASE).strip()
        match = re.search(r"\\{[\\s\\S]*\\}", raw)
        if not match:
            return {}
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def _to_score(self, value: Any, default: float = 5.0) -> float:
        try:
            number = float(value)
        except Exception:
            number = default
        if number < 0:
            return 0.0
        if number > 10:
            return 10.0
        return number
