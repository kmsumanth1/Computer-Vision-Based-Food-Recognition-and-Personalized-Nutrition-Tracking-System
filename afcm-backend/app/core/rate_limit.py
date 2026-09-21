import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request

from app.core.config import get_settings
from app.core.errors import AppError


class SlidingWindowLimiter:
    """In-memory limiter. Fine for one process; use Redis (or a proxy limit) when running several workers."""

    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.max_calls:
                raise AppError(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes and try again.")
            hits.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


login_limiter = SlidingWindowLimiter(max_calls=10, window_seconds=300)
forgot_limiter = SlidingWindowLimiter(max_calls=5, window_seconds=900)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def enforce(limiter: SlidingWindowLimiter, request: Request, extra: str = "") -> None:
    if not get_settings().rate_limit_enabled:
        return
    limiter.check(f"{client_ip(request)}|{extra.lower()}")
