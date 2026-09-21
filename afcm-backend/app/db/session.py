from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    url = get_settings().database_url
    if url.startswith("sqlite"):
        # Used by the test-suite. One shared in-memory connection.
        return create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    # pool_pre_ping survives MySQL closing idle connections; pool_recycle stays below wait_timeout.
    return create_engine(url, pool_pre_ping=True, pool_recycle=1800, pool_size=10, max_overflow=20)


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = get_sessionmaker()()
    try:
        yield db
    finally:
        db.close()
