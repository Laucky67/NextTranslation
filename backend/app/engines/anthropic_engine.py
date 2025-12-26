from anthropic import AsyncAnthropic

from app.engines.base import TranslationResult


class AnthropicEngine:
    """Anthropic Claude 翻译引擎"""

    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)
        self._id = "anthropic"
        self._name = "Anthropic Claude"
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
        """使用 Anthropic Claude 执行翻译"""
        options = options or {}
        custom_prompt = options.get("prompt", "")

        system_prompt = self._build_system_prompt(source_lang, target_lang, custom_prompt)

        try:
            response = await self.client.messages.create(
                model=options.get("model", "claude-sonnet-4-20250514"),
                max_tokens=4096,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": text},
                ],
            )

            translated_text = response.content[0].text if response.content else ""

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

    def _build_system_prompt(
        self, source_lang: str, target_lang: str, custom_prompt: str
    ) -> str:
        """构建系统提示词"""
        base_prompt = f"You are a professional translator. Translate the following text from {source_lang} to {target_lang}. Only output the translated text, without any explanations or additional content."

        if custom_prompt:
            base_prompt += f"\n\nAdditional instructions: {custom_prompt}"

        return base_prompt
