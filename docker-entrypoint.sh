#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Running production setup (admin user, etc.)..."
python scripts/deployment/setup_production.py

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
