"""依赖注入"""

import json
from fastapi import Header
from dataclasses import dataclass

from app.errors import ApiError


@dataclass
class EngineConfig:
    """引擎配置 - 与前端传递的配置对应"""

    api_key: str
    base_url: str
    channel: str  # "openai" | "anthropic"
    model: str | None = None


def _parse_single_engine_config(data: object) -> EngineConfig:
    if not isinstance(data, dict):
        raise ApiError(400, "invalid_engine_config", "引擎配置必须是 JSON 对象")

    api_key = str(data.get("apiKey", "") or "")
    if not api_key.strip():
        raise ApiError(400, "missing_api_key", "引擎配置缺少 apiKey")

    channel = str(data.get("channel", "openai") or "openai").strip()
    if channel not in {"openai", "anthropic"}:
        raise ApiError(
            400,
            "unsupported_channel",
            f"不支持的引擎渠道：{channel}",
            {"supported": ["openai", "anthropic"]},
        )

    base_url = str(data.get("baseUrl", "") or "")
    model_value = data.get("model")
    model = str(model_value) if isinstance(model_value, str) and model_value else None

    return EngineConfig(api_key=api_key, base_url=base_url, channel=channel, model=model)


def parse_engine_config(config_json: str) -> EngineConfig:
    """解析单个引擎配置 JSON"""
    try:
        data = json.loads(config_json)
        return _parse_single_engine_config(data)
    except json.JSONDecodeError as e:
        raise ApiError(400, "invalid_json", f"无效的引擎配置 JSON：{e}")


def parse_engine_configs(configs_json: str) -> list[EngineConfig]:
    """解析多个引擎配置 JSON"""
    try:
        data_list = json.loads(configs_json)
        if not isinstance(data_list, list):
            raise ApiError(400, "invalid_engine_configs", "引擎配置列表必须是 JSON 数组")

        return [_parse_single_engine_config(item) for item in data_list]
    except json.JSONDecodeError as e:
        raise ApiError(400, "invalid_json", f"无效的引擎配置列表 JSON：{e}")


async def get_engine_config(
    x_engine_config: str | None = Header(default=None, alias="X-Engine-Config"),
) -> EngineConfig:
    """从请求头获取单个引擎配置

    用于 Easy 和 Spec 翻译模式

    Header 格式:
    X-Engine-Config: {"apiKey": "sk-...", "baseUrl": "https://api.openai.com/v1", "channel": "openai", "model": "gpt-4o"}
    """
    if not x_engine_config:
        raise ApiError(400, "missing_engine_config", "缺少请求头 X-Engine-Config")
    return parse_engine_config(x_engine_config)


async def get_engine_configs(
    x_engine_configs: str | None = Header(default=None, alias="X-Engine-Configs"),
) -> list[EngineConfig]:
    """从请求头获取多个引擎配置

    用于 Vibe 翻译模式

    Header 格式:
    X-Engine-Configs: [{"apiKey": "sk-...", "channel": "openai", "model": "gpt-4o"}, {"apiKey": "sk-ant-...", "channel": "anthropic", "model": "claude-sonnet-4-20250514"}]
    """
    if not x_engine_configs:
        raise ApiError(400, "missing_engine_configs", "缺少请求头 X-Engine-Configs")
    return parse_engine_configs(x_engine_configs)


async def get_optional_judge_engine_config(
    x_judge_engine_config: str | None = Header(default=None, alias="X-Judge-Engine-Config"),
) -> EngineConfig | None:
    """可选：从请求头获取裁判引擎配置

    Header 格式:
    X-Judge-Engine-Config: {"apiKey": "...", "baseUrl": "...", "channel": "openai|anthropic", "model": "..."}
    """
    if not x_judge_engine_config:
        return None
    return parse_engine_config(x_judge_engine_config)
