# StreamFlow

Self-hosted music streaming — FastAPI backend, React/TypeScript frontend, PostgreSQL.

---

## Quick Deploy (Docker)

```bash
# Build (bakes the API URL into the frontend at compile time)
docker build \
  --build-arg VITE_BACKEND_URL=https://api.yourdomain.com \
  -t streamflow .

# Run
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e SECRET_KEY="$(openssl rand -hex 32)" \
  -v /data/streamflow/uploads:/streamflow/uploads \
  streamflow
```

The container runs `alembic upgrade head`, then `setup_production.py` (creates admin user), then starts uvicorn. The frontend is compiled into the image and served by FastAPI.

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key — **min 32 chars**. Generate: `openssl rand -hex 32` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins, e.g. `https://app.example.com` |
| `PORT` | `8000` | Listen port |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `ADMIN_EMAIL` | `admin@streamflow.com` | Admin account email |
| `ADMIN_PASSWORD` | *(generated)* | If unset, a random password is printed once on first start — save it |
| `CREATE_TEST_USER` | `false` | Set `true` to also create a demo user |
| `REDIS_URL` | — | Redis for rate-limiting (optional) |
| `UPLOAD_DIR` | `./uploads` | Upload directory path |

Copy `env.example` → `.env` for a full reference.

### Frontend env vars (build-time only)

Set via `--build-arg` or in `client/.env.local` for development.

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend origin, e.g. `https://api.yourdomain.com` |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash image search (optional) |
| `VITE_FLICKR_API_KEY` | Flickr image search fallback (optional) |
| `VITE_LASTFM_API_KEY` | Last.fm Artist of the Day (optional) |

See `client/env.example` for full details.

---

## Health Check

```
GET /health
```

Returns `200 OK` with `{"status": "healthy", "checks": {"database": "ok", "uploads": "ok"}}`.
Returns `503` if any component is degraded.

Used by Railway, Fly.io, and the Docker `HEALTHCHECK` directive automatically.

---

## Persistent Volume Warning

**Uploads are not ephemeral-safe.** Audio files and artwork live in `uploads/`. If the container or dyno restarts without a persistent volume, all uploaded music is lost.

- **Docker**: mount `-v /data/streamflow/uploads:/streamflow/uploads`
- **Railway**: attach a volume at `/streamflow/uploads` in the Railway dashboard
- **Fly.io**: volume is pre-configured in `fly.toml` (`streamflow_data` at `/app/uploads`). Create it before first deploy:

  ```bash
  fly volumes create streamflow_data --size 10
  fly deploy
  ```

---

## Backup & Restore

```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Database restore
psql $DATABASE_URL < backup_YYYYMMDD.sql

# Uploads backup
tar czf uploads_$(date +%Y%m%d).tar.gz uploads/

# Uploads restore
tar xzf uploads_YYYYMMDD.tar.gz
```

See [docs/deployment.md](docs/deployment.md) for platform-specific commands.

---

## Platform Guides

| Platform | Guide |
|---|---|
| Railway | [docs/deployment.md](docs/deployment.md) |
| Fly.io | `fly deploy` — uses `fly.toml` |
| Docker Compose (dev) | `docker-compose -f docker-compose.dev.yml up` |

---

## Development Quick-Start

```bash
# Backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env   # edit .env with your DB details
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd client
cp env.example .env.local   # edit VITE_BACKEND_URL if needed
npm install
npm run dev   # http://localhost:5173
```

API docs: http://localhost:8000/docs

---

## Stack

- **Backend**: FastAPI, SQLAlchemy, Alembic, PostgreSQL, slowapi (rate limiting)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Auth**: JWT (HS256)
- **File storage**: local filesystem (`uploads/`)
- **Optional APIs**: Unsplash, Flickr, Last.fm

---

## Features

- Upload and stream MP3, WAV, FLAC, M4A with range-request seeking
- Playlists with drag-and-drop reordering and custom cover images
- Like/unlike songs, listening history and statistics
- Artist of the Day (Last.fm)
- JWT authentication, user profiles, admin interface
- Rate-limited auth endpoints, CORS lockdown
