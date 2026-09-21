import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import install_error_handlers
from app.routers import auth, dashboard, food, health, meals, profile, water

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("afcm")


async def catch_unhandled_errors(request: Request, call_next):
    """
    Turns any unexpected crash (database down, missing table, a bug) into a normal JSON 500.

    Without this, Starlette answers crashes from outside the CORS layer, so the browser shows a misleading
    "blocked by CORS policy" error instead of the real problem. The traceback is still printed in this terminal.
    """
    try:
        return await call_next(request)
    except Exception:
        log.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": {"code": "SERVER_ERROR", "message": "Something went wrong on our side. Please try again in a moment."}},
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.auto_create_tables:
        from app.db.base import Base
        from app.db.session import get_engine
        import app.models  # noqa: F401  (registers the tables)

        Base.metadata.create_all(get_engine())
    if settings.seed_on_startup:
        from app.db.seed import seed_foods

        seed_foods()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    settings.assert_safe_for_production()
    is_prod = settings.app_env == "production"

    app = FastAPI(
        title="AI Food Calories Meter API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if is_prod else "/docs",
        redoc_url=None,
        openapi_url=None if is_prod else "/openapi.json",
    )
    # Order matters: middleware added later wraps the earlier ones, so CORS must be added after the catch-all.
    app.middleware("http")(catch_unhandled_errors)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],  # includes Authorization and X-Timezone
        allow_credentials=False,  # the frontend sends a bearer token, not cookies
    )
    install_error_handlers(app)
    for module in (health, auth, profile, dashboard, food, meals, water):
        app.include_router(module.router)
    return app


app = create_app()