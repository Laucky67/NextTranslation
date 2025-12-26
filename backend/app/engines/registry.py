from typing import Any

from app.engines.base import TranslationEngine


class EngineInfo:
    """引擎信息"""

    def __init__(
        self,
        id: str,
        name: str,
        engine_type: str,
        supported_languages: list[str],
        requires_key: str,
    ):
        self.id = id
        self.name = name
        self.engine_type = engine_type
        self.supported_languages = supported_languages
        self.requires_key = requires_key

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.engine_type,
            "supported_languages": self.supported_languages,
            "requires_key": self.requires_key,
        }


class EngineRegistry:
    """翻译引擎注册表"""

    def __init__(self):
        self._engines: dict[str, EngineInfo] = {}
        self._register_default_engines()

    def _register_default_engines(self):
        """注册默认引擎"""
        self.register(
            EngineInfo(
                id="openai",
                name="OpenAI GPT",
                engine_type="llm",
                supported_languages=[
                    "en", "zh", "ja", "ko", "fr", "de", "es", "pt", "ru", "ar",
                    "it", "nl", "pl", "tr", "vi", "th", "id", "ms", "hi", "bn"
                ],
                requires_key="openai",
            )
        )
        self.register(
            EngineInfo(
                id="anthropic",
                name="Anthropic Claude",
                engine_type="llm",
                supported_languages=[
                    "en", "zh", "ja", "ko", "fr", "de", "es", "pt", "ru", "ar",
                    "it", "nl", "pl", "tr", "vi", "th", "id", "ms", "hi", "bn"
                ],
                requires_key="anthropic",
            )
        )

    def register(self, engine_info: EngineInfo):
        """注册引擎"""
        self._engines[engine_info.id] = engine_info

    def list_engines(self) -> list[dict]:
        """列出所有注册的引擎"""
        return [engine.to_dict() for engine in self._engines.values()]

    def get_engine_info(self, engine_id: str) -> dict | None:
        """获取引擎信息"""
        engine = self._engines.get(engine_id)
        return engine.to_dict() if engine else None

    def has_engine(self, engine_id: str) -> bool:
        """检查引擎是否存在"""
        return engine_id in self._engines


# 全局引擎注册表实例
engine_registry = EngineRegistry()
