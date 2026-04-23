"""Rate limit 싱글톤.

slowapi 는 remote_address 를 키로 IP 단위 속도 제한을 건다.
- 단일 FastAPI 인스턴스 전제의 in-memory 저장소.
- 다중 인스턴스/수평 확장 시 Redis storage_uri 를 지정해야 한다
  (예: Limiter(key_func=..., storage_uri="redis://..."))
"""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
