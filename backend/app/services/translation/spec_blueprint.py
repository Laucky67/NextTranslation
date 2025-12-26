"""Spec Translation 蓝图生成服务（生成理论建议/分析与提示词分块）"""

from __future__ import annotations

from app.dependencies import EngineConfig
from app.errors import ApiError
from app.models.blueprint import (
    DTSTheoryConfig,
    EquivalenceTheoryConfig,
    FunctionalismTheoryConfig,
    SpecBlueprintRequest,
    TranslationBlueprint,
)
from app.prompts.blueprint import (
    EQUIVALENCE_DEFINITION,
    build_blueprint_default_prompt_blocks,
    build_dts_analysis_prompts,
    build_equivalence_suggestion_prompts,
)
from app.services.translation.base import BaseTranslationService


class SpecBlueprintService(BaseTranslationService):
    async def generate_blueprint(
        self, request: SpecBlueprintRequest, engine_config: EngineConfig
    ) -> TranslationBlueprint:
        engine = self.create_engine(engine_config)

        blueprint = request.blueprint
        self._normalize_theory_configs(blueprint)

        eq_cfg = self._get_cfg(blueprint, "equivalence")
        dts_cfg = self._get_cfg(blueprint, "dts")

        if isinstance(eq_cfg, EquivalenceTheoryConfig) and eq_cfg.enabled:
            if not eq_cfg.definition:
                eq_cfg.definition = EQUIVALENCE_DEFINITION
            eq_cfg.ai_suggestion = await self._generate_equivalence_suggestion(
                engine=engine,
                definition=eq_cfg.definition,
                source_lang=request.source_lang,
                target_lang=request.target_lang,
                source_text=request.text,
            )

        if isinstance(dts_cfg, DTSTheoryConfig) and dts_cfg.enabled:
            dts_cfg.ai_analysis = await self._generate_dts_analysis(
                engine=engine,
                reference_source=dts_cfg.reference_source,
                reference_translation=dts_cfg.reference_translation,
                source_text=request.text,
                source_lang=request.source_lang,
                target_lang=request.target_lang,
            )

        blueprint.prompt_blocks = build_blueprint_default_prompt_blocks(blueprint)
        return blueprint

    @staticmethod
    def _get_cfg(blueprint: TranslationBlueprint, theory_id: str):
        for cfg in blueprint.theory.configs:
            if cfg.id == theory_id:
                return cfg
        return None

    @staticmethod
    def _normalize_theory_configs(blueprint: TranslationBlueprint) -> None:
        """确保 theory.configs 至少包含三个理论项，并兼容旧 primary 单选字段。"""

        existing = {cfg.id: cfg for cfg in blueprint.theory.configs}

        if "equivalence" not in existing:
            existing["equivalence"] = EquivalenceTheoryConfig(enabled=False)
        if "functionalism" not in existing:
            existing["functionalism"] = FunctionalismTheoryConfig(enabled=False)
        if "dts" not in existing:
            existing["dts"] = DTSTheoryConfig(enabled=False)

        # 兼容旧请求/旧存档蓝图：只提供 theory.primary（单选）且没有显式 enabled，
        # 为避免历史数据直接失效，这里将 primary 对应理论视为 enabled。
        primary = blueprint.theory.primary
        if primary and all(getattr(cfg, "enabled", False) is False for cfg in existing.values()):
            existing[primary].enabled = True

        blueprint.theory.configs = [
            existing["equivalence"],
            existing["functionalism"],
            existing["dts"],
        ]

    async def _generate_equivalence_suggestion(
        self,
        engine,
        definition: str,
        source_lang: str,
        target_lang: str,
        source_text: str,
    ) -> str:
        system_prompt, user_content = build_equivalence_suggestion_prompts(
            definition=definition,
            source_lang=source_lang,
            target_lang=target_lang,
            source_text=source_text,
        )

        result = await engine.translate(
            text=user_content,
            source_lang=source_lang,
            target_lang=target_lang,
            options={"system_prompt": system_prompt},
        )
        if not result.success:
            raise ApiError(
                502,
                "upstream_blueprint_failed",
                "上游模型生成对等理论建议失败",
                {"error": result.error},
            )
        return (result.text or "").strip()

    async def _generate_dts_analysis(
        self,
        engine,
        reference_source: str | None,
        reference_translation: str | None,
        source_text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        system_prompt, user_content = build_dts_analysis_prompts(
            source_lang=source_lang,
            target_lang=target_lang,
            reference_source=reference_source,
            reference_translation=reference_translation,
            source_text=source_text,
        )

        result = await engine.translate(
            text=user_content,
            source_lang=source_lang,
            target_lang=target_lang,
            options={"system_prompt": system_prompt},
        )
        if not result.success:
            raise ApiError(
                502,
                "upstream_blueprint_failed",
                "上游模型生成 DTS 分析失败",
                {"error": result.error},
            )
        return (result.text or "").strip()
