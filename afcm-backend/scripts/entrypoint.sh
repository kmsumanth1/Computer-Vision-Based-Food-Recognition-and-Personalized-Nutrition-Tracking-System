#!/bin/sh
# Container start-up: create/upgrade tables, load starter foods (skips any that exist), run the API.
set -e
alembic upgrade head
python -m app.db.seed
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${WEB_CONCURRENCY:-2}" --proxy-headers
