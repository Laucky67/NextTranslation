from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


@dataclass(frozen=True)
class ApiError(Exception):
    status_code: int
    code: str
    message: str
    details: Any | None = None


def _json_error(code: str, message: str, details: Any | None = None) -> dict:
    payload: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        payload["error"]["details"] = details
    return payload


def install_error_handlers(app: FastAPI, *, debug: bool = False) -> None:
    @app.exception_handler(ApiError)
    async def _handle_api_error(_: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_json_error(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_json_error("validation_error", "请求参数校验失败", exc.errors()),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http_exception(_: Request, exc: StarletteHTTPException):
        if exc.status_code == 404:
            code = "not_found"
        elif exc.status_code == 401:
            code = "unauthorized"
        elif exc.status_code == 403:
            code = "forbidden"
        elif exc.status_code == 400:
            code = "bad_request"
        else:
            code = "http_error"

        if isinstance(exc.detail, str):
            message = exc.detail
            details = None
        else:
            message = "请求失败"
            details = exc.detail

        return JSONResponse(
            status_code=exc.status_code,
            content=_json_error(code, message, details),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected_error(_: Request, exc: Exception):
        details = None
        if debug:
            details = {"type": exc.__class__.__name__, "message": str(exc)}
        return JSONResponse(
            status_code=500,
            content=_json_error("internal_error", "服务器内部错误", details),
        )

