from openai import AsyncOpenAI

from app.engines.base import TranslationResult
from app.llm_debug import log_ai_sdk_params
from app.prompts.system import build_translation_system_prompt


class OpenAIEngine:
    """OpenAI GPT 翻译引擎

    支持 OpenAI API 及兼容接口（如 Azure OpenAI、各种代理服务）
    """

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        model: str | None = None,
    ):
        """初始化引擎

        Args:
            api_key: API 密钥
            base_url: API 基础 URL（可选，用于代理或兼容服务）
            model: 默认模型名称（可选）
        """
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url if base_url else None,
        )
        self._default_model = model or "gpt-4o-mini"
        self._id = "openai"
        self._name = "OpenAI GPT"
        self._engine_type = "llm"
        self._supported_languages = [
            "en", "zh", "ja", "ko", "fr", "de", "es", "pt", "ru", "ar",
            "it", "nl", "pl", "tr", "vi", "th", "id", "ms", "hi", "bn"
        ]

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def engine_type(self) -> str:
        return self._engine_type

    @property
    def supported_languages(self) -> list[str]:
        return self._supported_languages

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        options: dict | None = None,
    ) -> TranslationResult:
        """使用 OpenAI GPT 执行翻译

        Args:
            text: 待翻译文本
            source_lang: 源语言代码
            target_lang: 目标语言代码
            options: 可选参数
                - model: 使用的模型
                - prompt: 额外的翻译指令

        Returns:
            翻译结果
        """
        options = options or {}
        custom_prompt = options.get("prompt", "")
        system_prompt = options.get("system_prompt")
        model = options.get("model", self._default_model)

        if not system_prompt:
            system_prompt = build_translation_system_prompt(
                source_lang=source_lang,
                target_lang=target_lang,
                additional_instructions=custom_prompt,
            )

        try:
            params = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text},
                ],
                "temperature": 0.3,
            }
            # 这里打印的 params 与下一行实际传给 SDK 的 kwargs 完全一致
            log_ai_sdk_params("openai", params)
            response = await self.client.chat.completions.create(**params)

            translated_text = response.choices[0].message.content or ""

            return TranslationResult(
                text=translated_text.strip(),
                source_lang=source_lang,
                target_lang=target_lang,
                success=True,
            )
        except Exception as e:
            return TranslationResult(
                text="",
                source_lang=source_lang,
                target_lang=target_lang,
                success=False,
                error=str(e),
            )

    def _build_system_prompt(self, source_lang: str, target_lang: str, custom_prompt: str) -> str:
        return build_translation_system_prompt(
            source_lang=source_lang,
            target_lang=target_lang,
            additional_instructions=custom_prompt,
        )
