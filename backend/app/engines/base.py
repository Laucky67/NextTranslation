from typing import Protocol, runtime_checkable
from dataclasses import dataclass


@dataclass
class TranslationResult:
    """翻译结果"""

    text: str
    source_lang: str
    target_lang: str
    success: bool = True
    error: str | None = None


@runtime_checkable
class TranslationEngine(Protocol):
    """翻译引擎协议"""

    @property
    def id(self) -> str:
        """引擎唯一标识"""
        ...

    @property
    def name(self) -> str:
        """引擎显示名称"""
        ...

    @property
    def engine_type(self) -> str:
        """引擎类型: 'llm' 或 'traditional'"""
        ...

    @property
    def supported_languages(self) -> list[str]:
        """支持的语言列表"""
        ...

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        options: dict | None = None,
    ) -> TranslationResult:
        """执行翻译"""
        ...
