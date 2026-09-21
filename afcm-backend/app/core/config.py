from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    """All configuration comes from environment variables (or a .env file)."""

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    app_env: Literal["development", "test", "production"] = "development"
    # Comma-separated list of frontend origins allowed by CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Used for links in emails (password reset)
    frontend_url: str = "http://localhost:5173"
    # Fallback IANA timezone for "today" when the client doesn't send X-Timezone
    app_timezone: str = "UTC"

    # --- Database ---
    database_url: str = "mysql+pymysql://afcm:afcm@localhost:3306/afcm?charset=utf8mb4"
    # Dev convenience only. In production use `alembic upgrade head`.
    auto_create_tables: bool = False
    seed_on_startup: bool = False

    # --- Auth ---
    secret_key: str = DEFAULT_SECRET
    access_token_expire_minutes: int = 60 * 24 * 7
    reset_token_expire_minutes: int = 60
    rate_limit_enabled: bool = True

    # --- Email (password reset). Without SMTP_HOST the email is written to the log instead. ---
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "AI Food Calories Meter <no-reply@localhost>"
    smtp_use_tls: bool = True

    # --- AI food recognition ---
    # stub: development placeholder, NOT real recognition
    # onnx: your trained model in MODEL_DIR
    # none: endpoint answers 503 MODEL_NOT_READY
    ai_provider: Literal["stub", "onnx", "none"] = "stub"
    model_dir: Path = BASE_DIR / "models"
    model_file: str = "food_classifier.onnx"
    labels_file: str = "labels.json"
    label_map_file: str = "label_map.json"
    model_meta_file: str = "model_meta.json"
    # Below this top-1 confidence the photo counts as "not recognized"
    recognition_min_confidence: float = 0.25
    recognition_top_k: int = 5
    max_image_size_mb: int = 10

    # --- Barcode lookup ---
    # local: only the foods table. openfoodfacts: also ask Open Food Facts and cache the result.
    barcode_provider: Literal["local", "openfoodfacts"] = "local"
    openfoodfacts_timeout_s: float = 6.0

    @field_validator("model_dir", mode="before")
    @classmethod
    def _resolve_model_dir(cls, value: object) -> Path:
        path = Path(str(value))
        return path if path.is_absolute() else BASE_DIR / path

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def assert_safe_for_production(self) -> None:
        if self.app_env != "production":
            return
        if self.secret_key == DEFAULT_SECRET or len(self.secret_key) < 32:
            raise RuntimeError("Set SECRET_KEY to a random string of at least 32 characters in production.")
        if self.auto_create_tables:
            raise RuntimeError("Do not use AUTO_CREATE_TABLES in production. Run `alembic upgrade head`.")


@lru_cache
def get_settings() -> Settings:
    return Settings()
