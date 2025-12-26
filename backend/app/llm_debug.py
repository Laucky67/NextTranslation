from __future__ import annotations

import json
import logging
from typing import Any


uvicorn_logger = logging.getLogger("uvicorn.error")


def log_ai_sdk_params(provider: str, params: dict[str, Any], *, max_chars: int = 4000) -> None:
    safe = _redact_payload(params, max_chars=max_chars)
    try:
        body = json.dumps(safe, ensure_ascii=False, indent=2)
    except Exception:
        body = str(safe)
    uvicorn_logger.info("AI_SDK_PARAMS[%s]\n%s", provider, body)


def _redact_payload(payload: dict[str, Any], *, max_chars: int) -> dict[str, Any]:
    def clip(value: str) -> str:
        if len(value) <= max_chars:
            return value
        return value[:max_chars] + f"...(truncated, total={len(value)})"

    redacted: dict[str, Any] = {}
    for key, value in payload.items():
        if key.lower() in {"api_key", "apikey", "authorization"}:
            redacted[key] = "***REDACTED***"
            continue

        if isinstance(value, str):
            redacted[key] = clip(value)
        elif isinstance(value, list):
            new_list: list[Any] = []
            for item in value:
                if isinstance(item, dict):
                    new_list.append(_redact_payload(item, max_chars=max_chars))
                elif isinstance(item, str):
                    new_list.append(clip(item))
                else:
                    new_list.append(item)
            redacted[key] = new_list
        elif isinstance(value, dict):
            redacted[key] = _redact_payload(value, max_chars=max_chars)
        else:
            redacted[key] = value
    return redacted
