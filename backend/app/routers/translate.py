"""翻译 API 路由"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.models.translation import (
    EasyTranslateRequest,
    EasyTranslateResponse,
    VibeTranslateRequest,
    VibeTranslateResponse,
    SpecTranslateRequest,
    SpecTranslateResponse,
)
from app.dependencies import (
    EngineConfig,
    get_engine_config,
    get_engine_configs,
    get_optional_judge_engine_config,
)
from app.services.translation.easy import EasyTranslationService
from app.services.translation.vibe import VibeTranslationService
from app.services.translation.spec import SpecTranslationService
from app.sse import sse_event

router = APIRouter(prefix="/translate", tags=["translation"])


@router.post("/easy", response_model=EasyTranslateResponse)
async def easy_translate(
    request: EasyTranslateRequest,
    engine_config: EngineConfig = Depends(get_engine_config),
):
    """简易翻译端点 - 单引擎快速翻译

    请求示例:
    ```
    POST /api/translate/easy
    Headers:
        X-Engine-Config: {"apiKey": "sk-...", "baseUrl": "https://api.openai.com/v1", "channel": "openai", "model": "gpt-4o"}
    Body:
        {
            "text": "Hello world",
            "source_lang": "en",
            "target_lang": "zh",
            "prompt": "翻译成口语化的中文"
        }
    ```

    流程:
    1. 从请求头获取引擎配置 (X-Engine-Config)
    2. 根据 channel 创建翻译引擎实例
    3. 构建系统提示词（包含自定义提示）
    4. 调用 LLM API 执行翻译
    5. 返回翻译结果
    """
    service = EasyTranslationService()
    return await service.translate(request, engine_config)


@router.post("/vibe", response_model=VibeTranslateResponse)
async def vibe_translate(
    request: VibeTranslateRequest,
    engine_configs: list[EngineConfig] = Depends(get_engine_configs),
    judge_config: EngineConfig | None = Depends(get_optional_judge_engine_config),
):
    """氛围翻译端点 - 多引擎并行翻译 + AI 评分

    请求示例:
    ```
    POST /api/translate/vibe
    Headers:
        X-Engine-Configs: [
            {"apiKey": "sk-...", "baseUrl": "https://api.openai.com/v1", "channel": "openai", "model": "gpt-4o"},
            {"apiKey": "sk-ant-...", "baseUrl": "https://api.anthropic.com", "channel": "anthropic", "model": "claude-sonnet-4-20250514"}
        ]
    Body:
        {
            "text": "The quick brown fox",
            "source_lang": "en",
            "target_lang": "zh",
            "intent": "保持文学性和优雅感"
        }
    ```

    流程:
    1. 从请求头获取多个引擎配置 (X-Engine-Configs)
    2. 并行调用所有引擎执行翻译
    3. 使用 Judge LLM 对每个翻译结果评分
    4. 找出评分最高的结果作为推荐
    5. 返回所有结果及评分
    """
    service = VibeTranslationService()
    return await service.translate(request, engine_configs, judge_config=judge_config)


@router.post("/vibe/stream")
async def vibe_translate_stream(
    request: VibeTranslateRequest,
    engine_configs: list[EngineConfig] = Depends(get_engine_configs),
    judge_config: EngineConfig | None = Depends(get_optional_judge_engine_config),
):
    """氛围翻译（流式）：

    - 任一引擎译文先返回（partial 事件）
    - 全部完成后由裁判模型统一打分 + 50字内评语 + 综合生成最终最佳译文（final 事件）

    前端需要用 fetch 读取流（EventSource 无法 POST）。
    """
    service = VibeTranslationService()

    async def event_stream():
        async for kind, payload in service.translate_stream(
            request, engine_configs, judge_config=judge_config
        ):
            if kind == "partial":
                yield sse_event("partial", payload.model_dump())
            elif kind == "final":
                yield sse_event("final", payload.model_dump())
        yield sse_event("done", {"ok": True})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/spec", response_model=SpecTranslateResponse)
async def spec_translate(
    request: SpecTranslateRequest,
    engine_config: EngineConfig = Depends(get_engine_config),
):
    """规范翻译端点 - 基于翻译蓝图的专业翻译

    请求示例:
    ```
    POST /api/translate/spec
    Headers:
        X-Engine-Config: {"apiKey": "sk-...", "baseUrl": "https://api.openai.com/v1", "channel": "openai", "model": "gpt-4o"}
    Body:
        {
            "text": "技术文档内容",
            "source_lang": "zh",
            "target_lang": "en",
            "blueprint": {
                "theory": {
                    "primary": "functionalism",
                    "configs": [{"id": "functionalism", "purpose": "技术文档", "targetAudience": "开发者"}]
                },
                "method": {"preference": "literal", "weight": 0.7},
                "strategy": {"approach": "domestication", "weight": 0.6},
                "context": "这是 API 文档"
            }
        }
    ```

    流程:
    1. 从请求头获取引擎配置 (X-Engine-Config)
    2. 将蓝图配置转换为 LLM 可理解的系统提示词
    3. 调用 LLM API 执行翻译
    4. 生成翻译决策说明
    5. 返回翻译结果及决策说明
    """
    service = SpecTranslationService()
    return await service.translate(request, engine_config)
