from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "nexttranslation-api"}
