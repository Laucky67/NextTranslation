from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # CORS 配置
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # API 配置
    api_prefix: str = "/api"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
