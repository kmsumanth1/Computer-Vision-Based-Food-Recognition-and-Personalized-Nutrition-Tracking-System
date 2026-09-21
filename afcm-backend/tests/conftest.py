import os

# Must be set before the app is imported. Run the suite against MySQL/MariaDB with TEST_DATABASE_URL.
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite://")
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["AI_PROVIDER"] = "stub"
os.environ["BARCODE_PROVIDER"] = "local"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import delete  # noqa: E402

import app.models  # noqa: E402,F401
from app.ai.registry import reset_recognizer  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.seed import seed_foods  # noqa: E402
from app.db.session import get_engine, get_sessionmaker  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Food, FoodAlias, MealEntry, PasswordResetToken, Profile, User, WaterLog, WeightLog  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema():
    engine = get_engine()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_db():
    """Every test starts with the starter foods and no users."""
    with get_sessionmaker()() as db:
        for model in (MealEntry, WaterLog, WeightLog, PasswordResetToken, Profile, User, FoodAlias, Food):
            db.execute(delete(model))
        db.commit()
    seed_foods()
    get_settings.cache_clear()
    reset_recognizer()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


PROFILE = {
    "name": "Ravi Kumar",
    "sex": "male",
    "age": 28,
    "height_cm": 175,
    "weight_kg": 72,
    "body_fat_percentage": 16,
    "activity_level": "moderate",
    "goal": "cut",
}


@pytest.fixture
def auth(client):
    """Registers a user and returns headers for authenticated calls."""
    res = client.post("/auth/register", json={"name": "Ravi Kumar", "email": "ravi@example.com", "password": "password123"})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def user(client, auth):
    """A signed-in user who has finished profile setup."""
    res = client.post("/profile/setup", json=PROFILE, headers=auth)
    assert res.status_code == 200, res.text
    return auth


def make_png(color=(200, 120, 60), size=(320, 240)) -> bytes:
    import io

    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()
