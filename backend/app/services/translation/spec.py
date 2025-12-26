"""规范翻译服务"""

from app.models.translation import (
    SpecTranslateRequest,
    SpecTranslateResponse,
    TranslationDecision,
)
from app.services.translation.base import BaseTranslationService
from app.dependencies import EngineConfig
from app.errors import ApiError
from app.prompts.spec import build_spec_blueprint_instructions


class SpecTranslationService(BaseTranslationService):
    """规范翻译服务

    规范翻译模式：基于翻译蓝图(blueprint)的专业翻译
    支持配置：
    - 翻译理论：对等理论、功能主义、描述翻译学
    - 翻译方法：直译、意译、平衡
    - 翻译策略：归化、异化
    - 额外上下文信息
    """

    async def translate(
        self,
        request: SpecTranslateRequest,
        engine_config: EngineConfig,
    ) -> SpecTranslateResponse:
        """执行规范翻译

        Args:
            request: 翻译请求（包含蓝图配置）
            engine_config: 引擎配置

        Returns:
            包含翻译结果和决策说明的响应
        """
        engine = self.create_engine(engine_config)

        # 构建基于蓝图的提示词
        blueprint_prompt = build_spec_blueprint_instructions(request.blueprint)

        result = await engine.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            options={"prompt": blueprint_prompt},
        )

        if not result.success:
            raise ApiError(
                502,
                "upstream_translation_failed",
                "上游翻译服务调用失败",
                {"error": result.error},
            )

        # 生成翻译决策说明
        decisions = self._generate_decisions(request.blueprint)

        return SpecTranslateResponse(
            translated_text=result.text,
            source_lang=result.source_lang,
            target_lang=result.target_lang,
            blueprint_applied=request.blueprint,
            decisions=decisions,
        )

    def _generate_decisions(self, blueprint) -> list[TranslationDecision]:
        """生成翻译决策说明

        解释翻译过程中的关键决策点
        """
        decisions = []

        # 理论框架决策
        theory_names = {
            "equivalence": "对等理论（动态对等）",
            "functionalism": "功能主义（目的论）",
            "dts": "描述翻译学（DTS）",
        }
        enabled_theories: list[str] = []
        theory_group = getattr(blueprint, "theory", None)
        for cfg in getattr(theory_group, "configs", []) or []:
            if getattr(cfg, "enabled", False):
                name = theory_names.get(getattr(cfg, "id", ""), getattr(cfg, "id", ""))
                if name:
                    enabled_theories.append(name)
        theory_id = getattr(theory_group, "primary", None)
        if not enabled_theories and theory_id:
            enabled_theories = [theory_names.get(theory_id, theory_id)]
        theory_decision = (
            "、".join(enabled_theories) if enabled_theories else "未启用（仅按方法/策略执行）"
        )
        decisions.append(
            TranslationDecision(
                aspect="理论框架",
                decision=theory_decision,
                rationale="基于已启用的理论分块指导整体翻译方向",
            )
        )

        # 翻译方法决策
        method_names = {
            "literal": "直译",
            "free": "意译",
            "balanced": "平衡",
            "adaptation": "改编",
        }
        method_cfg = getattr(blueprint, "method", None)
        method_pref = getattr(method_cfg, "preference", "balanced")
        method_weight = getattr(method_cfg, "weight", 0.5)
        decisions.append(
            TranslationDecision(
                aspect="翻译方法",
                decision=method_names.get(method_pref, method_pref),
                rationale=f"方法倾向程度: {method_weight:.0%}",
            )
        )

        # 翻译策略决策
        strategy_names = {
            "domestication": "归化",
            "foreignization": "异化",
        }
        strategy_cfg = getattr(blueprint, "strategy", None)
        strategy_approach = getattr(strategy_cfg, "approach", "domestication")
        strategy_weight = getattr(strategy_cfg, "weight", 0.5)
        decisions.append(
            TranslationDecision(
                aspect="翻译策略",
                decision=strategy_names.get(strategy_approach, strategy_approach),
                rationale=f"策略应用强度: {strategy_weight:.0%}",
            )
        )

        return decisions
