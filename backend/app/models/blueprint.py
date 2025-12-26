from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from typing import Annotated, Literal


TheoryId = Literal["equivalence", "functionalism", "dts"]
PromptBlockId = Literal[
    "theory.equivalence",
    "theory.functionalism",
    "theory.dts",
    "method",
    "strategy",
    "context",
]


class PromptBlock(BaseModel):
    """提示词分块（用户可编辑 content）"""

    model_config = ConfigDict(populate_by_name=True)

    id: PromptBlockId = Field(..., description="分块标识")
    enabled: bool = Field(default=True, description="是否启用该分块")
    title: str = Field(..., description="分块标题（系统展示用，不可编辑）")
    content: str = Field(default="", description="分块内容（可编辑）")
    sources: list[str] | None = Field(
        default=None, description="可选：内容来源标记（system/ai/user）"
    )


class EquivalenceTheoryConfig(BaseModel):
    """对等理论配置（统一为动态对等）"""

    model_config = ConfigDict(populate_by_name=True)

    id: Literal["equivalence"] = "equivalence"
    enabled: bool = Field(default=False, description="是否启用对等理论")
    definition: str | None = Field(default=None, description="理论定义（可选，后端可补默认）")
    ai_suggestion: str | None = Field(default=None, description="AI 给出的对等理论建议")
    # 兼容旧字段：过去区分 formal/dynamic；现在统一为 dynamic
    equivalence_type: Literal["formal", "dynamic"] | None = Field(
        default=None, alias="equivalenceType"
    )


class FunctionalismTheoryConfig(BaseModel):
    """功能主义/目的论配置"""

    model_config = ConfigDict(populate_by_name=True)

    id: Literal["functionalism"] = "functionalism"
    enabled: bool = Field(default=False, description="是否启用功能主义")
    purpose: str | None = Field(default=None, description="翻译目的")
    target_audience: str | None = Field(default=None, alias="targetAudience")


class DTSTheoryConfig(BaseModel):
    """描述翻译学（DTS）配置"""

    model_config = ConfigDict(populate_by_name=True)

    id: Literal["dts"] = "dts"
    enabled: bool = Field(default=False, description="是否启用 DTS")
    reference_source: str | None = Field(default=None, alias="referenceSource")
    reference_translation: str | None = Field(default=None, alias="referenceTranslation")
    ai_analysis: str | None = Field(default=None, description="AI 产出的 DTS 分析与建议")


TheoryConfig = Annotated[
    EquivalenceTheoryConfig | FunctionalismTheoryConfig | DTSTheoryConfig,
    Field(discriminator="id"),
]


class TheoryConfigGroup(BaseModel):
    """理论配置组（支持多理论同时启用）"""

    model_config = ConfigDict(populate_by_name=True)

    primary: TheoryId | None = Field(default=None, description="兼容字段：历史单选理论")
    emphasis: list[str] = Field(default_factory=list, description="兼容字段：理论重点")
    configs: list[TheoryConfig] = Field(default_factory=list, description="多理论配置列表")


class MethodConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    preference: Literal["literal", "free", "balanced", "adaptation"] = Field(
        default="balanced"
    )
    weight: float = Field(default=0.5, ge=0.0, le=1.0)


class StrategyConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    approach: Literal["domestication", "foreignization"] = Field(default="domestication")
    weight: float = Field(default=0.5, ge=0.0, le=1.0)


class TechniquesConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    use_terminology: bool = Field(default=False, alias="useTerminology")
    terminology_source: str | None = Field(default=None, alias="terminologySource")
    extract_terms: bool = Field(default=False, alias="extractTerms")


class TranslationBlueprint(BaseModel):
    """翻译蓝图（支持多理论 + 提示词分块）"""

    model_config = ConfigDict(populate_by_name=True)

    theory: TheoryConfigGroup = Field(default_factory=TheoryConfigGroup)
    method: MethodConfig = Field(default_factory=MethodConfig)
    strategy: StrategyConfig = Field(default_factory=StrategyConfig)
    techniques: TechniquesConfig = Field(default_factory=TechniquesConfig)
    context: str = Field(default="", description="额外上下文说明")
    prompt_blocks: list[PromptBlock] | None = Field(
        default=None, alias="prompt_blocks", description="提示词分块列表"
    )


class SpecBlueprintRequest(BaseModel):
    """规范翻译蓝图生成请求"""

    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(..., description="待翻译原文（用于理论分析）")
    source_lang: str = Field(default="auto", description="源语言代码")
    target_lang: str = Field(..., description="目标语言代码")
    blueprint: TranslationBlueprint = Field(
        default_factory=TranslationBlueprint, description="蓝图（包含理论启用与配置）"
    )


class SpecBlueprintResponse(BaseModel):
    """规范翻译蓝图生成响应"""

    model_config = ConfigDict(populate_by_name=True)

    blueprint: TranslationBlueprint = Field(
        ..., description="生成后的蓝图（包含 AI 产物与提示词分块）"
    )

