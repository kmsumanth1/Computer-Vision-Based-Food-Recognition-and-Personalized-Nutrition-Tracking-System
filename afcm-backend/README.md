# AI Food Calories Meter: backend

FastAPI + MySQL API for the AI Food Calories Meter frontend. It handles accounts, profiles and calorie targets, the nutrition
database, meals, water, history, barcode lookup, and the AI food-recognition endpoint.

The AI model is **not included**. Until you train one, `AI_PROVIDER=stub` returns placeholder answers so the whole app can be
used. See [`ml/README.md`](ml/README.md) to add your datasets and train it.

```
app/
  main.py            app setup, CORS, routers
  routers/           HTTP endpoints (auth, profile, dashboard/history, food, meals, water, health)
  services/          the logic: nutrition_plan.py (targets), food_service.py (nutrition maths), meals, history, auth
  ai/                recognizers: stub, onnx (your trained model), and the image preprocessing
  models/            database tables            schemas/   request and response shapes
  db/                session, seed.py, import_foods.py (CSV importer)
  data/              starter foods + CSV template
alembic/             database migrations
ml/                  dataset checker + training script (PyTorch, run on your training machine)
models/              put food_classifier.onnx, labels.json here (created by ml/train.py)
tests/               pytest suite
```

## Run it

### Option A: Docker (API + MySQL)

```bash
cp .env.example .env        # set SECRET_KEY at least
docker compose up --build   # http://localhost:8000/docs
```

### Option B: locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# MySQL 8: create the database and user once
#   CREATE DATABASE afcm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#   CREATE USER 'afcm'@'%' IDENTIFIED BY 'afcm'; GRANT ALL ON afcm.* TO 'afcm'@'%';

cp .env.example .env
alembic upgrade head            # creates the tables
python -m app.db.seed           # loads the starter foods
uvicorn app.main:app --reload   # http://localhost:8000/docs
```

## Connect the frontend

In the frontend's `.env`:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

and make sure the frontend's origin is in this backend's `CORS_ORIGINS`. Nothing else changes: the endpoints, request
bodies, responses and error shapes are the ones the frontend's types describe.

## Endpoints

All except `/auth/*` and `/health` need `Authorization: Bearer <token>`. Errors are `{"detail": {"code", "message"}}`.

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | returns `{access_token, token_type, user}` |
| POST | `/auth/forgot-password` | always answers the same message, whether or not the email exists |
| POST | `/auth/reset-password` | `{token, password}`. Used by the link in the reset email |
| POST | `/profile/setup` | saves the profile (`plan` is `null`; the frontend calls calculate next) |
| GET / PUT | `/profile` | profile + plan. PUT accepts any subset and recalculates targets |
| POST | `/nutrition/calculate` | Cut / Maintain / Bulk calories, macro targets, water target |
| GET | `/dashboard?date=` | plan, totals, water, that day's meals |
| POST | `/food/analyze` | multipart field `image`. Returns the recognised food + typical-serving nutrition |
| POST | `/food/calculate-weight` | `{food_id or food_name, weight_g}` returns nutrition for that weight |
| POST | `/food/barcode` | `{barcode}` returns a product |
| GET / POST | `/meals`, `/meals/{id}` PUT / DELETE | log, edit (weight change recalculates), delete |
| GET / POST | `/water` | daily water total, add an amount |
| GET | `/history?range=` | `today`, `yesterday`, `last_7_days`, `last_30_days`. Every day is returned, zeros included |
| GET | `/health` | database status and which AI provider is active |

Error codes the frontend already has friendly text for: `INVALID_CREDENTIALS`, `EMAIL_EXISTS`, `PROFILE_NOT_FOUND`,
`FOOD_NOT_RECOGNIZED`, `INVALID_IMAGE`, `BARCODE_NOT_FOUND`, `NUTRITION_UNAVAILABLE`, `INVALID_WEIGHT`.
Others you may see: `MODEL_NOT_READY` (503), `BARCODE_LOOKUP_FAILED` (502), `RATE_LIMITED` (429), `INVALID_RESET_TOKEN` (400).

### Rules the backend enforces

- **All nutrition is calculated here.** A meal request sends only `food_id` and `weight_g`; anything nutrition-shaped in the
  body is ignored. Editing a meal's weight recalculates it from the foods table.
- **"Today" follows the user.** The frontend sends its timezone in `X-Timezone`; `APP_TIMEZONE` is the fallback.
- **Privacy:** each user only sees their own meals and water (other users' ids return 404).
- **Passwords** are hashed with Argon2. Login answers identically for a wrong password and an unknown email.
  `/auth/login` and `/auth/forgot-password` are rate-limited per IP.

## Calorie targets

`app/services/nutrition_plan.py`, the only place these are calculated:

- Basal energy: average of Mifflin-St Jeor and Katch-McArdle (uses body fat %).
- × activity factor from the daily-steps band (low 1.35, moderate 1.55, high 1.75).
- Cut −20 %, Maintain 0 %, Bulk +10 %, rounded to 10 kcal. Cut never goes below 1500 kcal (male) / 1200 kcal (female).
- Protein 2.2 / 2.0 / 1.8 g per kg (cut / bulk / maintain), fat 25 % of calories, carbs the remainder.
- Water 35 ml per kg (+500 ml for high activity).

These are general estimates, not medical advice. Adjust the constants at the top of that file to suit your product.

## Foods and barcodes

The foods table (nutrition per 100 g) is what every number comes from. `python -m app.db.seed` loads about 18 approximate
starter foods so the app works out of the box. **Replace them with real data** for anything user-facing:

```bash
python -m app.db.import_foods my_foods.csv --dry-run
python -m app.db.import_foods my_foods.csv --update
```

(columns: `app/data/foods_template.csv`). Manual entry ("chicken", "roti") matches food names and aliases, tolerating small
typos. Barcodes are looked up in the foods table. Set `BARCODE_PROVIDER=openfoodfacts` to also query Open Food Facts for
unknown barcodes; found products are saved to your database, so each is fetched once.

## Tests

```bash
pip install -r requirements-dev.txt
pytest                                                                    # SQLite, no setup
TEST_DATABASE_URL="mysql+pymysql://afcm:afcm@127.0.0.1/afcm_test?charset=utf8mb4" pytest   # against MySQL/MariaDB
```

## Before going live

- `APP_ENV=production` with a random `SECRET_KEY` (32+ chars). The app refuses to start otherwise. `/docs` is switched off.
- Put it behind HTTPS (the camera and barcode features in the frontend need it anyway).
- Set `CORS_ORIGINS` to your real frontend origin(s) and `FRONTEND_URL`. Configure `SMTP_*` so password-reset emails are sent.
- Run migrations with `alembic upgrade head` (after model changes: `alembic revision --autogenerate -m "..."`).
- The rate limiter is in memory per process. With several workers or servers, also limit at your proxy or add Redis.
- Access tokens last 7 days (`ACCESS_TOKEN_EXPIRE_MINUTES`); there is no refresh-token flow, matching the frontend.
- Back up the MySQL volume.
