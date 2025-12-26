from fastapi import APIRouter, Depends, HTTPException

from app.models.translation import (
    EasyTranslateRequest,
    EasyTranslateResponse,
    VibeTranslateRequest,
    VibeTranslateResponse,
    SpecTranslateRequest,
    SpecTranslateResponse,
)
from app.services.translation import TranslationService
from app.dependencies import get_api_keys, APIKeys

router = APIRouter(prefix="/translate", tags=["translation"])


@router.post("/easy", response_model=EasyTranslateResponse)
async def easy_translate(
    request: EasyTranslateRequest,
    api_keys: APIKeys = Depends(get_api_keys),
):
    """简易翻译端点 - 单引擎快速翻译"""
    service = TranslationService(api_keys)
    try:
        result = await service.easy_translate(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vibe", response_model=VibeTranslateResponse)
async def vibe_translate(
    request: VibeTranslateRequest,
    api_keys: APIKeys = Depends(get_api_keys),
):
    """氛围翻译端点 - 多引擎并行翻译 + 评分"""
    service = TranslationService(api_keys)
    try:
        result = await service.vibe_translate(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spec", response_model=SpecTranslateResponse)
async def spec_translate(
    request: SpecTranslateRequest,
    api_keys: APIKeys = Depends(get_api_keys),
):
    """规范翻译端点 - 基于蓝图的专业翻译"""
    service = TranslationService(api_keys)
    try:
        result = await service.spec_translate(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
