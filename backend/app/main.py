from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, translate, engines


def create_app() -> FastAPI:
    """创建并配置 FastAPI 应用"""
    app = FastAPI(
        title="NextTranslation API",
        description="多层次翻译平台 API",
        version="0.1.0",
    )

    # 配置 CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 注册路由
    app.include_router(health.router)
    app.include_router(translate.router, prefix=settings.api_prefix)
    app.include_router(engines.router, prefix=settings.api_prefix)

    return app


app = create_app()
