from pydantic import BaseModel, Field
from typing import Literal


class EasyTranslateRequest(BaseModel):
    """简易翻译请求"""

    text: str = Field(..., description="要翻译的文本")
    source_lang: str = Field(default="auto", description="源语言代码，auto 表示自动检测")
    target_lang: str = Field(..., description="目标语言代码")
    prompt: str | None = Field(default=None, description="自定义提示词")
    engine: str = Field(default="openai", description="使用的翻译引擎")


class EasyTranslateResponse(BaseModel):
    """简易翻译响应"""

    translated_text: str = Field(..., description="翻译结果")
    source_lang: str = Field(..., description="源语言（检测到的或指定的）")
    target_lang: str = Field(..., description="目标语言")
    engine: str = Field(..., description="使用的引擎")


class EngineResult(BaseModel):
    """单个引擎的翻译结果"""

    engine_id: str
    engine_name: str
    translated_text: str
    success: bool = True
    error: str | None = None


class TranslationScore(BaseModel):
    """翻译评分"""

    accuracy: float = Field(..., ge=0, le=10, description="准确性评分")
    fluency: float = Field(..., ge=0, le=10, description="流畅度评分")
    style_match: float = Field(..., ge=0, le=10, description="风格匹配评分")
    terminology: float = Field(..., ge=0, le=10, description="术语一致性评分")
    overall: float = Field(..., ge=0, le=10, description="综合评分")
    comment: str | None = Field(default=None, description="评分说明")


class ScoredEngineResult(BaseModel):
    """带评分的引擎结果"""

    engine_id: str
    engine_name: str
    translated_text: str
    success: bool = True
    error: str | None = None
    score: TranslationScore | None = None


class VibeTranslateRequest(BaseModel):
    """氛围翻译请求"""

    text: str = Field(..., description="要翻译的文本")
    source_lang: str = Field(default="auto", description="源语言代码")
    target_lang: str = Field(..., description="目标语言代码")
    intent: str = Field(..., description="翻译意图描述")
    engines: list[str] = Field(default=["openai", "anthropic"], description="使用的引擎列表")


class VibeTranslateResponse(BaseModel):
    """氛围翻译响应"""

    source_lang: str
    target_lang: str
    intent: str
    results: list[ScoredEngineResult]
    best_result: ScoredEngineResult | None = None
    synthesized_translation: str | None = None
    synthesis_rationale: str | None = None


class TranslationBlueprint(BaseModel):
    """翻译蓝图"""

    theory: dict = Field(
        default_factory=lambda: {"primary": "equivalence", "emphasis": []},
        description="翻译理论配置",
    )
    method: dict = Field(
        default_factory=lambda: {"preference": "literal", "weight": 0.5},
        description="翻译方法配置",
    )
    strategy: dict = Field(
        default_factory=lambda: {"approach": "domestication", "weight": 0.5},
        description="翻译策略配置",
    )
    techniques: dict = Field(
        default_factory=lambda: {
            "useTerminology": False,
            "terminologySource": None,
            "extractTerms": False,
        },
        description="翻译技巧配置",
    )
    context: str = Field(default="", description="额外上下文说明")


class SpecTranslateRequest(BaseModel):
    """规范翻译请求"""

    text: str = Field(..., description="要翻译的文本")
    source_lang: str = Field(default="auto", description="源语言代码")
    target_lang: str = Field(..., description="目标语言代码")
    blueprint: TranslationBlueprint = Field(
        default_factory=TranslationBlueprint, description="翻译蓝图"
    )
    engine: str = Field(default="openai", description="使用的翻译引擎")


class TranslationDecision(BaseModel):
    """翻译决策说明"""

    aspect: str = Field(..., description="决策方面")
    decision: str = Field(..., description="做出的决策")
    rationale: str = Field(..., description="决策理由")


class SpecTranslateResponse(BaseModel):
    """规范翻译响应"""

    translated_text: str
    source_lang: str
    target_lang: str
    blueprint_applied: TranslationBlueprint
    decisions: list[TranslationDecision] | None = None
    extracted_terms: list[dict] | None = None
