from fastapi import APIRouter

from app.engines.registry import engine_registry

router = APIRouter(prefix="/engines", tags=["engines"])


@router.get("")
async def list_engines():
    """获取所有可用翻译引擎列表"""
    engines = engine_registry.list_engines()
    return {"engines": engines}


@router.get("/{engine_id}")
async def get_engine(engine_id: str):
    """获取指定引擎的详细信息"""
    engine_info = engine_registry.get_engine_info(engine_id)
    if engine_info is None:
        return {"error": f"Engine '{engine_id}' not found"}
    return engine_info
