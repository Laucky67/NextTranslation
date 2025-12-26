from pydantic import BaseModel
from dataclasses import dataclass


@dataclass
class APIKeys:
    """API 密钥集合"""

    openai_key: str | None = None
    anthropic_key: str | None = None
    google_key: str | None = None
    deepl_key: str | None = None
