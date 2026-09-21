from fastapi import FastAPI, Request
from starlette.exceptions import HTTPException
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Raised for expected failures. Rendered as {"detail": {"code", "message"}}, the shape the frontend reads."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def not_found(message: str = "Not found.", code: str = "NOT_FOUND") -> AppError:
    return AppError(404, code, message)


def validation_error(message: str, code: str = "VALIDATION_ERROR") -> AppError:
    return AppError(422, code, message)


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": {"code": exc.code, "message": exc.message}})

    @app.exception_handler(HTTPException)
    async def handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
        # Keep our error shape for plain HTTPExceptions too (404 for unknown routes, 405, ...)
        if isinstance(exc.detail, dict):
            content = {"detail": exc.detail}
        else:
            code = {401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(
                exc.status_code, "ERROR"
            )
            content = {"detail": {"code": code, "message": str(exc.detail)}}
        return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)
