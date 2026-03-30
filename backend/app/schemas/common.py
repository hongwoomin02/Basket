"""공통 응답 스키마 — BACKEND_DATA_IA.md 규약 기반"""
import uuid
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Meta(BaseModel):
    request_id: str = ""


class Response(BaseModel, Generic[T]):
    data: T
    meta: Meta = Meta()


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = {}


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ─── 에러 코드 상수 ────────────────────────────────────
class ErrorCode:
    NOT_FOUND = "NOT_FOUND"
    FORBIDDEN = "FORBIDDEN"
    UNAUTHORIZED = "UNAUTHORIZED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    SLOT_NOT_RESERVABLE = "SLOT_NOT_RESERVABLE"
    DUPLICATE_RESERVATION = "DUPLICATE_RESERVATION"
    INVALID_RESERVATION_STATE = "INVALID_RESERVATION_STATE"
    PAYMENT_METHOD_NOT_SET = "PAYMENT_METHOD_NOT_SET"
    REVIEW_DISABLED = "REVIEW_DISABLED"
