"""简易翻译服务"""

from app.models.translation import (
    EasyTranslateRequest,
    EasyTranslateResponse,
)
from app.services.translation.base import BaseTranslationService
from app.dependencies import EngineConfig
from app.errors import ApiError


class EasyTranslationService(BaseTranslationService):
    """简易翻译服务

    简易翻译模式：单引擎快速翻译，支持自定义提示词
    """

    async def translate(
        self,
        request: EasyTranslateRequest,
        engine_config: EngineConfig,
    ) -> EasyTranslateResponse:
        """执行简易翻译

        Args:
            request: 翻译请求
            engine_config: 引擎配置

        Returns:
            翻译响应
        """
        engine = self.create_engine(engine_config)

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
            raise ApiError(
                502,
                "upstream_translation_failed",
                "上游翻译服务调用失败",
                {"error": result.error},
            )

        return EasyTranslateResponse(
            translated_text=result.text,
            source_lang=result.source_lang,
            target_lang=result.target_lang,
            engine=request.engine or "custom",
        )
