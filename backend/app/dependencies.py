from fastapi import Header

from app.models.api_keys import APIKeys


async def get_api_keys(
    x_openai_key: str | None = Header(default=None, alias="X-OpenAI-Key"),
    x_anthropic_key: str | None = Header(default=None, alias="X-Anthropic-Key"),
    x_google_key: str | None = Header(default=None, alias="X-Google-Key"),
    x_deepl_key: str | None = Header(default=None, alias="X-DeepL-Key"),
) -> APIKeys:
    """从请求头获取 API 密钥"""
    return APIKeys(
        openai_key=x_openai_key,
        anthropic_key=x_anthropic_key,
        google_key=x_google_key,
        deepl_key=x_deepl_key,
    )
