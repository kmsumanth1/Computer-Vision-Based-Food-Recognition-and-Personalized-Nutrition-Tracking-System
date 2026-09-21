import json

import pytest
from PIL import Image

from app.db.import_foods import import_csv, read_rows
from app.db.session import get_sessionmaker
from app.models import Food
from ml.check_dataset import check_dataset, known_food_ids

CSV_HEADER = "id,name,calories,reference_weight_g,aliases,protein_g,carbs_g,fat_g,fiber_g,sugar_g,saturated_fat_g,sodium_mg,cholesterol_mg,kind\n"


def write_csv(tmp_path, body: str):
    path = tmp_path / "foods.csv"
    path.write_text(CSV_HEADER + body, encoding="utf-8")
    return path


# ---- CSV import -----------------------------------------------------------------------------

def test_import_creates_foods_and_aliases(client, user, tmp_path):
    path = write_csv(tmp_path, "masala-dosa,Masala dosa,168,180,dosa|masala dosai,3.9,25,6,1.5,1,1.2,300,0,food\n")
    assert import_csv(path) == {"created": 1, "updated": 0, "skipped": 0}
    res = client.post("/food/calculate-weight", json={"food_name": "dosa", "weight_g": 180}, headers=user)
    assert res.status_code == 200 and res.json()["food_id"] == "masala-dosa"
    assert res.json()["nutrition"]["calories"] == 302  # 168 x 1.8
    with get_sessionmaker()() as db:
        assert db.get(Food, "masala-dosa").source == "import"


def test_import_skips_existing_unless_update(tmp_path):
    path = write_csv(tmp_path, "paneer,Paneer (fresh),260,100,,18,3,20,0,0,0,0,0,food\n")
    assert import_csv(path)["skipped"] == 1
    with get_sessionmaker()() as db:
        assert db.get(Food, "paneer").calories_100g == 296
    assert import_csv(path, update=True)["updated"] == 1
    with get_sessionmaker()() as db:
        assert db.get(Food, "paneer").calories_100g == 260


def test_import_dry_run_writes_nothing(tmp_path):
    path = write_csv(tmp_path, "new-food,New food,100,100,,1,1,1,0,0,0,0,0,food\n")
    import_csv(path, dry_run=True)
    with get_sessionmaker()() as db:
        assert db.get(Food, "new-food") is None


@pytest.mark.parametrize(
    "row,message",
    [
        ("a,,100,100,,,,,,,,,,food", "name is empty"),
        (",A,100,100,,,,,,,,,,food", "id is empty"),
        ("a,A,abc,100,,,,,,,,,,food", "not a number"),
        ("a,A,-5,100,,,,,,,,,,food", "negative"),
        ("a,A,100,0,,,,,,,,,,food", "above 0"),
        ("a,A,100,100,,,,,,,,,,drink", "kind must be"),
    ],
)
def test_import_rejects_bad_rows_before_writing(tmp_path, row, message):
    with pytest.raises(ValueError, match=message):
        read_rows(write_csv(tmp_path, row + "\n"))


def test_import_rejects_duplicates_and_missing_columns(tmp_path):
    with pytest.raises(ValueError, match="duplicate"):
        read_rows(write_csv(tmp_path, "a,A,1,1,,,,,,,,,,food\na,B,1,1,,,,,,,,,,food\n"))
    bad = tmp_path / "bad.csv"
    bad.write_text("id,name\na,A\n")
    with pytest.raises(ValueError, match="Missing required column"):
        read_rows(bad)


# ---- dataset checker ------------------------------------------------------------------------

def make_dataset(root, layout: dict[str, dict[str, int]]):
    for split, classes in layout.items():
        for label, count in classes.items():
            folder = root / split / label
            folder.mkdir(parents=True, exist_ok=True)
            for i in range(count):
                Image.new("RGB", (8, 8), (i % 255, 0, 0)).save(folder / f"{i}.jpg")


def test_dataset_check_passes_on_a_good_dataset(tmp_path):
    make_dataset(tmp_path, {"train": {"chapati": 30, "dal": 30}, "val": {"chapati": 5, "dal": 5}})
    report = check_dataset(tmp_path, known_food_ids(), min_images=30)
    assert report.ok and not report.warnings
    assert report.train_counts == {"chapati": 30, "dal": 30}


def test_dataset_check_finds_problems(tmp_path):
    make_dataset(tmp_path, {"train": {"chapati": 40, "mystery_dish": 3, "dal": 0}, "val": {"chapati": 4, "ghost": 2}})
    (tmp_path / "train" / "dal").mkdir(exist_ok=True)
    (tmp_path / "train" / "chapati" / "broken.jpg").write_bytes(b"not an image")
    report = check_dataset(tmp_path, known_food_ids(), deep=True)
    text = "\n".join(report.errors + report.warnings)
    assert not report.ok
    assert "'dal' has no images" in text
    assert "'mystery_dish' -> 'mystery_dish' is not in the nutrition database" in text
    assert "only 3 images" in text
    assert "val/ has class 'ghost'" in text
    assert "Unreadable image" in text
    assert "no validation images" in text


def test_label_map_resolves_class_names(tmp_path):
    make_dataset(tmp_path, {"train": {"roti_photos": 30, "dal": 30}})
    without = check_dataset(tmp_path, known_food_ids(), min_images=30)
    with_map = check_dataset(tmp_path, known_food_ids(), {"roti_photos": "chapati"}, min_images=30)
    assert not without.ok and with_map.ok


def test_missing_train_folder(tmp_path):
    assert not check_dataset(tmp_path, set()).ok


# ---- CORS / plumbing ------------------------------------------------------------------------

def test_cors_preflight_allows_the_frontend(client):
    res = client.options(
        "/food/calculate-weight",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type,x-timezone",
        },
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "http://localhost:5173"
    allowed = res.headers["access-control-allow-headers"].lower()
    assert "authorization" in allowed and "x-timezone" in allowed


def test_cors_blocks_other_origins(client):
    res = client.options("/profile", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in res.headers


def test_unknown_route_uses_the_error_shape(client):
    res = client.get("/nope")
    assert res.status_code == 404 and res.json()["detail"]["code"] == "NOT_FOUND"


def test_production_refuses_the_default_secret(monkeypatch):
    from app.core.config import Settings

    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        Settings(app_env="production", secret_key="change-me-in-production").assert_safe_for_production()
    Settings(app_env="production", secret_key="x" * 40).assert_safe_for_production()
    with pytest.raises(RuntimeError, match="AUTO_CREATE_TABLES"):
        Settings(app_env="production", secret_key="x" * 40, auto_create_tables=True).assert_safe_for_production()


def test_rate_limit_blocks_repeated_logins(client, monkeypatch):
    from app.core import rate_limit

    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()
    rate_limit.login_limiter.reset()
    codes = [client.post("/auth/login", json={"email": "x@example.com", "password": "wrong-password"}).status_code for _ in range(12)]
    assert codes[:10] == [401] * 10 and codes[10:] == [429, 429]
    rate_limit.login_limiter.reset()
