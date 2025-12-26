"""翻译服务基类"""

from app.engines.openai_engine import OpenAIEngine
from app.engines.anthropic_engine import AnthropicEngine
from app.dependencies import EngineConfig
from app.errors import ApiError


class BaseTranslationService:
    """翻译服务基类"""

    def create_engine(self, config: EngineConfig):
        """根据配置创建引擎实例"""
        if config.channel == "openai":
            return OpenAIEngine(
                api_key=config.api_key,
                base_url=config.base_url,
                model=config.model,
            )
        elif config.channel == "anthropic":
            return AnthropicEngine(
                api_key=config.api_key,
                base_url=config.base_url,
                model=config.model,
            )
        else:
            raise ApiError(
                400,
                "unsupported_channel",
                f"不支持的引擎渠道：{config.channel}",
                {"supported": ["openai", "anthropic"]},
            )
