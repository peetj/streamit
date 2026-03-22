# StreamFlow Implementers Guide

This guide is for operators deploying, configuring, and maintaining StreamFlow in production. It covers infrastructure setup, deployment procedures, configuration reference, ongoing operations, and troubleshooting. For code architecture see the developer guide; for end-user features see the user guide.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Deployment Options Summary](#2-deployment-options-summary)
3. [Docker Deployment](#3-docker-deployment)
4. [Railway Deployment](#4-railway-deployment)
5. [Fly.io Deployment](#5-flyio-deployment)
6. [Environment Variable Reference](#6-environment-variable-reference)
7. [First-Run Admin Setup](#7-first-run-admin-setup)
8. [CORS Configuration](#8-cors-configuration)
9. [Persistent Storage](#9-persistent-storage)
10. [Health Check](#10-health-check)
11. [Logging and Observability](#11-logging-and-observability)
12. [Database Migrations](#12-database-migrations)
13. [Backup and Restore](#13-backup-and-restore)
14. [Upgrading](#14-upgrading)
15. [Security Hardening Checklist](#15-security-hardening-checklist)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Prerequisites

Before deploying StreamFlow, ensure the following are in place.

### PostgreSQL database

StreamFlow requires PostgreSQL 13 or later. The database must be reachable from the application container or process before startup begins. The connection string is provided via `DATABASE_URL`.

Supported connection string formats:

```
postgresql://user:password@host:5432/dbname
postgresql://user:password@host:5432/dbname?sslmode=require
```

Railway's PostgreSQL plugin provides `DATABASE_URL` automatically. For self-hosted deployments, provision PostgreSQL separately (managed service, Docker container, or bare-metal install).

### Persistent storage for uploads

Audio files, album artwork, and user profile images are written to the `uploads/` directory at runtime. This directory must be backed by a persistent volume — not the container's ephemeral filesystem. If uploads are stored ephemerally, all user-uploaded content is lost on every container restart or redeploy.

See [Section 9](#9-persistent-storage) for per-platform instructions.

### A generated SECRET_KEY

The application signs JWT tokens using `SECRET_KEY`. At startup, the app validates that the key:

- Is not empty or a known default placeholder value
- Is at least 32 characters long

If either check fails, the process exits immediately with a `FATAL` log message. Generate a key before deployment:

```bash
openssl rand -hex 32
```

Store the output as the `SECRET_KEY` environment variable or secret. Do not reuse keys across environments.

### Domain and TLS (public-facing deployments)

If StreamFlow is accessible from the internet:

- Terminate TLS at a reverse proxy (nginx, Caddy, a cloud load balancer, or the platform's built-in TLS termination).
- Set `CORS_ORIGINS` to the exact HTTPS origin(s) of your frontend. Do not leave it as `*` in production.
- Fly.io enforces HTTPS automatically via `force_https = true` in `fly.toml`. Railway provides TLS at the platform edge.

---

## 2. Deployment Options Summary

| Method | Best for | Frontend handling | Persistent storage | Platform manages TLS |
|---|---|---|---|---|
| Docker single-container | Self-hosted VMs, bare-metal, any OCI runtime | Compiled into image at build time | Volume mount required | No — use a reverse proxy |
| Railway | Fast cloud deploys, managed Postgres | Built via Nixpacks at deploy time | Temporary (no volume) — uploads lost on redeploy | Yes |
| Fly.io | Cloud deploys with persistent volume support | Compiled into image at deploy time | Fly volume (`fly volumes create`) | Yes |

All three paths run the same startup sequence via `docker-entrypoint.sh`:

1. `alembic upgrade head` — applies any pending database migrations
2. `python scripts/deployment/setup_production.py` — verifies DB connectivity, creates the admin user if absent
3. `uvicorn app.main:app --host 0.0.0.0 --port 8000` — starts the application server

On Railway, step 3 runs via the `startCommand` in `railway.json` and steps 1–2 run in the `postDeploy` hook. The effective result is the same.

---

## 3. Docker Deployment

Docker is the primary and most portable deployment path. The image is a two-stage build: Stage 1 compiles the React frontend; Stage 2 packages the Python backend and embeds the compiled frontend.

### 3.1 Building the image

The frontend is baked into the image at build time. If your StreamFlow instance is accessed via a known URL, pass it as a build argument so the React bundle points to the correct backend:

```bash
docker build \
  --build-arg VITE_BACKEND_URL=https://stream.example.com \
  -t streamflow:latest .
```

If `VITE_BACKEND_URL` is omitted, the frontend will attempt to reach the backend at the same origin, which works when backend and frontend are served from the same domain (the normal Docker single-container setup).

The Dockerfile sets the working directory to `/streamflow`. The uploads directory inside the container is `/streamflow/uploads`.

### 3.2 Running the container

```bash
docker run -d \
  --name streamflow \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@db-host:5432/streamflow_music" \
  -e SECRET_KEY="$(openssl rand -hex 32)" \
  -e CORS_ORIGINS="https://stream.example.com" \
  -e LOG_LEVEL="INFO" \
  -v /data/streamflow/uploads:/streamflow/uploads \
  streamflow:latest
```

Key points:

- The volume mount (`-v`) maps a persistent host path to `/streamflow/uploads`. Replace `/data/streamflow/uploads` with a real persistent path on your host.
- `DATABASE_URL` must point to an already-running PostgreSQL instance.
- The container runs as the non-root user `streamflow_user` (created at image build time).
- Port 8000 is the application port. Place a reverse proxy (nginx, Caddy, Traefik) in front for TLS termination.

### 3.3 What the entrypoint does

`docker-entrypoint.sh` is minimal and sequential:

```sh
set -e
alembic upgrade head
python scripts/deployment/setup_production.py
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`set -e` means any step failure aborts startup before uvicorn launches, which prevents a partially-initialised application from serving traffic. Migration failures and database connectivity failures are fatal.

### 3.4 Docker Compose (development)

For local development, `docker-compose.dev.yml` starts four services: `frontend` (Vite dev server on port 3000), `backend` (uvicorn on port 8000 with source-mounted hot reload), `db` (PostgreSQL 15), and `redis` (Redis 7).

```bash
docker-compose -f docker-compose.dev.yml up
```

The dev compose file mounts `./uploads` into the backend container, so uploads persist to the local filesystem during development. Do not use the dev compose file in production.

---

## 4. Railway Deployment

### Step 1 — Connect the repository

In the Railway dashboard, create a new project and connect your GitHub repository. Railway detects the Nixpacks build configuration from `railway.json`.

### Step 2 — Add a PostgreSQL service

In the Railway project, click **Add Service** and select **PostgreSQL**. Railway will provision a database and automatically inject `DATABASE_URL` into all services in the project. You do not need to set this variable manually.

### Step 3 — Set required environment variables

In the service's **Variables** tab, add:

| Variable | Value |
|---|---|
| `SECRET_KEY` | Output of `openssl rand -hex 32` |
| `CORS_ORIGINS` | The HTTPS URL Railway assigns to your service (e.g. `https://streamflow-production.up.railway.app`) |

Optional variables to consider:

| Variable | Value |
|---|---|
| `ADMIN_EMAIL` | Email address for the initial admin account |
| `ADMIN_PASSWORD` | Password for the initial admin account (if not set, a random password is generated and logged once) |
| `LOG_LEVEL` | `INFO` for production |

### Step 4 — Deploy

Trigger a deploy by pushing a commit or clicking **Deploy** in the dashboard. Railway runs the Nixpacks build, then executes:

- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Post-deploy hook: `python scripts/deployment/setup_production.py`

### Step 5 — Verify the health endpoint

Once the deploy completes, check:

```
GET https://<your-app>.up.railway.app/health
```

A `200` response with `{"status": "healthy", ...}` confirms the database is reachable and the uploads directory is writable.

### Important note on persistent storage

Railway does not provide a persistent volume for the filesystem by default. Uploads written to the container's local filesystem are lost on every redeploy. For a production Railway deployment where users upload content, attach a volume service or use an external object storage backend. This is a known limitation of the Railway path.

---

## 5. Fly.io Deployment

Fly.io supports persistent volumes, making it suitable for production deployments that require durable file storage.

### Step 1 — Install flyctl and authenticate

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### Step 2 — Create the application

If deploying for the first time, create the app (the name must match `app` in `fly.toml`):

```bash
fly apps create streamflow-app
```

### Step 3 — Create the persistent volume

```bash
fly volumes create streamflow_data --size 10 --region iad
```

Adjust `--size` (GB) and `--region` to match your requirements. The volume is mounted at `/app/uploads` as defined in `fly.toml`:

```toml
[mounts]
  source = "streamflow_data"
  destination = "/app/uploads"
```

Note: the Fly.io mount destination is `/app/uploads`. This differs from the Docker single-container path (`/streamflow/uploads`). The `UPLOAD_DIR` environment variable must match the mount point if it is set explicitly.

### Step 4 — Set secrets

```bash
fly secrets set \
  DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  SECRET_KEY="$(openssl rand -hex 32)" \
  CORS_ORIGINS="https://streamflow-app.fly.dev"
```

### Step 5 — Deploy

```bash
fly deploy
```

Fly builds the Docker image (running the two-stage build including the React compilation), pushes it, and starts the container. The entrypoint sequence runs automatically: migrations, admin setup, then uvicorn.

### Step 6 — Verify

```bash
fly status
curl https://streamflow-app.fly.dev/health
```

### Key fly.toml settings

| Setting | Value | Purpose |
|---|---|---|
| `primary_region` | `iad` (default) | Change to the region nearest your users |
| `force_https` | `true` | Redirects HTTP to HTTPS at the platform edge |
| `auto_stop_machines` | `true` | Stops idle machines to reduce cost |
| `min_machines_running` | `0` | Set to `1` to avoid cold starts on production |
| `memory_mb` | `1024` | Minimum recommended; audio processing may require more |
| Health check path | `/health` | 30 s interval, 5 s timeout, 10 s grace period |

---

## 6. Environment Variable Reference

All variables are read at application startup. The app loads `.env` from the working directory if present; environment variables take precedence.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. Supports `postgres://` and `postgresql://` schemes. SSL mode is appended automatically when a `DATABASE_URL` environment variable is detected. |
| `SECRET_KEY` | Yes | — | JWT signing key. Must be at least 32 characters. Must not be a known placeholder. Generate with `openssl rand -hex 32`. The app exits at startup if this check fails. |
| `CORS_ORIGINS` | Yes (prod) | `*` | Comma-separated list of allowed frontend origins. Use `*` only in development. In production, set to the exact HTTPS origin(s) of your frontend. |
| `PORT` | No | `8000` | Port uvicorn listens on. Overridden by platform (Railway injects `PORT` automatically). |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity. Accepted values: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`. |
| `ADMIN_EMAIL` | No | `admin@streamflow.com` | Email address for the admin account created on first run. |
| `ADMIN_PASSWORD` | No | _(random)_ | Password for the admin account. If not set, a cryptographically random 20-character password is generated and printed once to stdout. |
| `CREATE_TEST_USER` | No | `false` | Set to `true` to create a demo user (`test@streamflow.com`) on first run. Not recommended for production. |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string. Used by slowapi for distributed rate limiting. If Redis is unavailable, rate limiting falls back to in-memory storage. |
| `UPLOAD_DIR` | No | `./uploads` | Filesystem path for uploaded files. Must match the volume mount point in containerised deployments. |
| `MAX_FILE_SIZE` | No | `50000000` | Maximum upload size in bytes (default 50 MB). |
| `ALLOWED_EXTENSIONS` | No | `["mp3","wav","flac","m4a"]` | JSON array of permitted audio file extensions. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT token lifetime in minutes. |

---

## 7. First-Run Admin Setup

`scripts/deployment/setup_production.py` runs automatically as part of the entrypoint sequence on every startup. It is idempotent — safe to run repeatedly.

### What it does

1. **Verifies database connectivity** — attempts to connect up to 5 times with exponential backoff (2 s, 4 s, 8 s, 16 s, 32 s). Exits with a non-zero code if all attempts fail, which aborts the entrypoint and prevents uvicorn from starting.

2. **Runs Alembic migrations** — calls `alembic upgrade head`. If tables already exist and a `DuplicateColumn` or `already exists` error is detected, the script treats this as a no-op and continues.

3. **Creates the admin user** — looks up the email from `ADMIN_EMAIL` (default: `admin@streamflow.com`). If that email already exists in the database, this step is skipped. If not:
   - Reads `ADMIN_PASSWORD` from the environment.
   - If `ADMIN_PASSWORD` is not set or empty, generates a cryptographically random 20-character password using `secrets.choice` over letters, digits, and symbols.
   - Creates the user with `role="admin"` and `is_active=True`.
   - Prints the generated password to stdout with a warning to save it immediately.

4. **Optionally creates a test user** — only if `CREATE_TEST_USER=true`. Also generates a random password printed to stdout.

### Retrieving the generated admin password

If you did not pre-set `ADMIN_PASSWORD`, find the generated password in the startup logs immediately after the first deploy. The password is printed exactly once and is not stored anywhere retrievable after the process exits.

For Docker:
```bash
docker logs streamflow 2>&1 | grep "Generated password"
```

For Fly.io:
```bash
fly logs | grep "Generated password"
```

For Railway, check the deploy logs in the dashboard.

If you miss the password, the only recovery path is to connect to the database directly and update the hashed password, or delete the admin user row and redeploy to trigger re-creation.

### Pre-setting the admin password

To avoid the above, set `ADMIN_PASSWORD` before the first deploy:

```bash
# Docker
docker run -e ADMIN_PASSWORD="your-chosen-password" ...

# Fly.io
fly secrets set ADMIN_PASSWORD="your-chosen-password"

# Railway
# Add ADMIN_PASSWORD in the Variables tab before the first deploy
```

---

## 8. CORS Configuration

StreamFlow uses FastAPI's `CORSMiddleware`. The allowed origins are controlled entirely by the `CORS_ORIGINS` environment variable.

When `CORS_ORIGINS` is `*`, `allow_credentials` is set to `False` (browsers do not send cookies or Authorization headers with wildcard CORS). When `CORS_ORIGINS` is set to specific origins, `allow_credentials` is set to `True`, which is required for the JWT bearer token flow to work correctly from a browser.

### Single origin

```
CORS_ORIGINS=https://stream.example.com
```

### Multiple origins (comma-separated, no spaces required but spaces are stripped)

```
CORS_ORIGINS=https://stream.example.com,https://www.example.com
```

### Development (open — do not use in production)

```
CORS_ORIGINS=*
```

### What happens if CORS_ORIGINS is wrong

If the frontend origin does not appear in the allowed list, the browser will block API responses. The backend will process the request but return a response without `Access-Control-Allow-Origin`, causing browser-side CORS errors. This does not affect API clients that are not browsers (curl, Postman, server-to-server calls).

---

## 9. Persistent Storage

### What is stored

The `uploads/` directory contains three subdirectories:

| Path | Contents |
|---|---|
| `uploads/audio/` | User-uploaded audio files (MP3, WAV, FLAC, M4A) |
| `uploads/artwork/` | Album artwork images extracted or uploaded by users |
| `uploads/profile/` | User profile avatar images |

The directories are created automatically at startup if they do not exist, but the parent volume must already be mounted and writable.

### Why persistence is required

If `uploads/` is stored in the container's ephemeral layer:

- Every container restart (crash recovery, redeploy, scaling event) permanently deletes all uploaded audio and images.
- Database records referencing those files become stale — the database knows files exist but the files are gone. This causes broken playback and missing artwork for all content uploaded before the restart.

### Per-platform instructions

**Docker single-container:**

Mount a host directory or named volume to `/streamflow/uploads`:

```bash
# Named volume (recommended — Docker manages lifecycle)
docker volume create streamflow_uploads
docker run -v streamflow_uploads:/streamflow/uploads ...

# Host bind mount (useful when you want direct filesystem access)
docker run -v /data/streamflow/uploads:/streamflow/uploads ...
```

Ensure the host path is on a disk that survives container restarts. For cloud VMs, attach a persistent block volume and mount it before running Docker.

**Railway:**

Railway does not provide a persistent volume for the default filesystem. Uploads stored in the container will be lost on redeploy. For production use on Railway with durable uploads, you need to integrate external object storage (S3-compatible). This is not built into the current version of StreamFlow.

**Fly.io:**

Create a Fly volume and it is automatically mounted at `/app/uploads` per the `fly.toml` configuration:

```bash
fly volumes create streamflow_data --size 10 --region iad
```

The volume persists across deploys and machine restarts. To expand storage later:

```bash
fly volumes extend <volume-id> --size 20
```

### Verifying the uploads directory

The health endpoint (`GET /health`) checks that `uploads/` exists and is writable. A `503` response with `"uploads": "error: directory missing or not writable"` indicates the volume is not mounted or the process lacks write permissions.

The container runs as `streamflow_user` (non-root). If a host bind mount is used, ensure the host directory is owned or writable by UID 1000 (the UID assigned to `streamflow_user` in the Debian-based image), or set permissions to `755`/`777` as appropriate for your security posture.

---

## 10. Health Check

### Endpoint

```
GET /health
```

No authentication required.

### Response format

Healthy (HTTP 200):
```json
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "uploads": "ok"
  }
}
```

Degraded (HTTP 503):
```json
{
  "status": "degraded",
  "checks": {
    "database": "error: could not connect to server: Connection refused",
    "uploads": "ok"
  }
}
```

The status is `healthy` only when every check returns `"ok"`. Any single failure sets the status to `"degraded"` and the HTTP status code to `503`.

### What each check does

- **`database`**: Opens a SQLAlchemy session and executes `SELECT 1`. Catches all exceptions and returns the exception message on failure.
- **`uploads`**: Confirms that `uploads/` is a directory and that the process has write access (`os.access(uploads, os.W_OK)`).

### Wiring to a load balancer or uptime monitor

- **Fly.io**: The health check is already configured in `fly.toml` (30 s interval, 5 s timeout, 10 s grace period on startup). No additional setup needed.
- **Docker with a reverse proxy**: Configure your reverse proxy to poll `http://localhost:8000/health` and remove the backend from the pool on a `503` or connection failure.
- **Uptime monitors** (UptimeRobot, Betterstack, etc.): Add `https://your-domain/health` as an HTTP monitor. Alert on any non-200 response.
- **Docker HEALTHCHECK**: Already defined in the Dockerfile — checks every 30 seconds with a 30-second timeout, 5-second start period, and 3 retries before marking the container unhealthy.

---

## 11. Logging and Observability

### Log format

All application logs are written to stdout in the following format:

```
YYYY-MM-DD HH:MM:SS LEVEL logger.name: message
```

Example:
```
2026-03-22 14:05:33 INFO     app.main: Database tables created successfully
2026-03-22 14:05:34 WARNING  app.main: Production setup failed with return code 1
```

Logs are unbuffered (`PYTHONUNBUFFERED=1` is set in the Dockerfile), so they appear in real time in `docker logs` and platform log streams.

### Controlling log verbosity

Set the `LOG_LEVEL` environment variable:

| Level | Use case |
|---|---|
| `DEBUG` | Development and active troubleshooting only. Logs SQL queries, request internals, and detailed tracebacks. Do not use in production — output volume is high and may expose sensitive data. |
| `INFO` | Recommended for production. Logs startup events, migration status, admin setup results, and request lifecycle events. |
| `WARNING` | Logs only conditions that may require attention (setup partial failures, retry events). |
| `ERROR` | Logs only failure conditions. Use with an external log aggregator that alerts on errors. |
| `CRITICAL` | Logs only fatal conditions. The SECRET_KEY validation failure logs at this level before the process exits. |

### Accessing logs

```bash
# Docker
docker logs streamflow
docker logs -f streamflow       # follow

# Fly.io
fly logs
fly logs --app streamflow-app

# Railway
# View in the Railway dashboard under Deployments > Logs
```

### External log aggregation

For persistent log storage, ship stdout to a log aggregator (Datadog, Logtail, Loki, CloudWatch, etc.) using your platform's log drain or a sidecar log forwarder. No application-level changes are needed — all logs go to stdout.

---

## 12. Database Migrations

StreamFlow uses Alembic for schema migrations. Migration history lives in `alembic/versions/`.

### Automatic migrations on deploy

`docker-entrypoint.sh` runs `alembic upgrade head` before uvicorn starts on every deployment. This means:

- Schema changes introduced in new application versions are applied automatically.
- The application never starts against a schema that is behind the current revision.
- If a migration fails, the entrypoint exits with a non-zero code, uvicorn does not start, and the previous deployment continues serving traffic (on platforms that support rolling deploys, like Fly.io).

### Running migrations manually

If you need to run migrations outside of a normal deploy (emergency fix, debugging):

```bash
# Docker — exec into the running container
docker exec -it streamflow alembic upgrade head

# Fly.io
fly ssh console --app streamflow-app
alembic upgrade head

# From a local machine with DATABASE_URL set
DATABASE_URL="postgresql://..." alembic upgrade head
```

### Checking the current revision

```bash
alembic current
```

### Rolling back a migration

```bash
# Roll back one revision
alembic downgrade -1

# Roll back to a specific revision
alembic downgrade <revision_id>
```

Use downgrade with caution in production. A downgrade may destroy data (dropping columns, tables). Always take a database backup before downgrading.

### Checking migration history

```bash
alembic history --verbose
```

---

## 13. Backup and Restore

### Database backup

Use `pg_dump` to create a consistent snapshot:

```bash
pg_dump \
  --no-password \
  --format=custom \
  --file=streamflow-$(date +%Y%m%d-%H%M%S).dump \
  "$DATABASE_URL"
```

The `--format=custom` flag produces a compressed, restoreable archive. It is significantly smaller than plain SQL and supports parallel restore.

### Database restore

```bash
pg_restore \
  --no-password \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  streamflow-20260322-140000.dump
```

`--clean --if-exists` drops existing objects before recreating them. If restoring to a fresh database, omit these flags or create the database first with `createdb`.

### Uploads backup

Archive the entire uploads directory:

```bash
tar -czf streamflow-uploads-$(date +%Y%m%d-%H%M%S).tar.gz /data/streamflow/uploads/
```

For Docker volumes:

```bash
docker run --rm \
  -v streamflow_uploads:/uploads \
  -v $(pwd):/backup \
  alpine \
  tar -czf /backup/streamflow-uploads-$(date +%Y%m%d-%H%M%S).tar.gz /uploads
```

### Restore uploads

```bash
tar -xzf streamflow-uploads-20260322-140000.tar.gz -C /
```

### Recommended backup schedule

| Backup type | Frequency | Retention |
|---|---|---|
| Database (pg_dump) | Every 6 hours | 7 days of daily dumps, 4 weeks of weekly dumps |
| Uploads (tar) | Daily | 7 daily, 4 weekly |

Many managed PostgreSQL providers (Railway, Supabase, Neon, RDS) include automated point-in-time recovery. Verify what is included in your plan and supplement with `pg_dump` exports for off-site copies.

### Off-site storage

Store backup archives in a location separate from the production host:
- Object storage (S3, R2, GCS, B2) with versioning enabled
- A different cloud region or provider than the production deployment

A backup stored on the same host or volume as the application does not protect against host failure, volume corruption, or accidental deletion.

---

## 14. Upgrading

### Process overview

1. Pull or build the new image.
2. Take a database backup before deploying (see Section 13).
3. Deploy the new image. The entrypoint runs `alembic upgrade head` automatically, applying any new migrations.
4. Verify the health endpoint returns `{"status": "healthy"}`.

### Docker

```bash
docker pull streamflow:new-version
# or rebuild
docker build --build-arg VITE_BACKEND_URL=https://stream.example.com -t streamflow:latest .

docker stop streamflow
docker rm streamflow
docker run -d --name streamflow \
  [... same flags as original run command ...] \
  streamflow:latest
```

The uploads volume persists across container replacements because it is a named volume or host bind mount, not part of the container layer.

### Fly.io

```bash
fly deploy
```

Fly performs a rolling deploy: it starts the new machine, waits for the health check to pass, then terminates the old machine. User uploads are preserved on the persistent volume.

### Railway

Push a commit or trigger a redeploy from the dashboard. Railway replaces the running container with the new build. The `postDeploy` hook runs migrations.

### Migration safety

Alembic migrations are applied before the application starts serving traffic. On platforms with rolling deploys (Fly.io), there is a brief window where the old application version is running against the new schema. Write migrations to be backward-compatible where possible:

- Add columns as nullable before making them required.
- Do not drop or rename columns in the same migration that removes application code referencing them.
- Prefer additive migrations over destructive ones.

---

## 15. Security Hardening Checklist

Work through this list before exposing a StreamFlow deployment to the internet.

- **SECRET_KEY strength**: Must be at least 32 random characters. Generated with `openssl rand -hex 32` produces 64 hex characters. The app enforces the 32-character minimum at startup and exits if the check fails, but a 64-character key is preferred.

- **CORS_ORIGINS locked down**: Set `CORS_ORIGINS` to the exact HTTPS origin(s) of your frontend. Verify it is not `*` in production. A wildcard CORS configuration allows any website to make authenticated API requests on behalf of logged-in users.

- **Default admin password changed**: If the admin account was created with a generated password, verify it was logged and stored securely. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` were not pre-set, check deploy logs for the generated password. Log in and verify the account is accessible.

- **No test user in production**: Ensure `CREATE_TEST_USER` is not set to `true` in production. A test user with a known or logged password is an unnecessary attack surface.

- **HTTPS enforced**: All traffic should be encrypted in transit. Fly.io enforces this via `force_https = true`. For self-hosted Docker, configure TLS termination at the reverse proxy layer and redirect HTTP to HTTPS.

- **Rate limiting on auth endpoints**: Rate limiting via slowapi is active on `/api/auth/register/` (5 requests/minute per IP) and `/api/auth/login/` (10 requests/minute per IP). This is enabled by default and requires no configuration. If Redis is configured via `REDIS_URL`, rate limit counters are stored in Redis and survive process restarts; otherwise they are in-memory and reset on restart.

- **LOG_LEVEL not DEBUG in production**: `DEBUG` level logs may include request details, query parameters, and stack traces. Set `LOG_LEVEL=INFO` or higher in production.

- **Upload directory not publicly listed**: The `/uploads` path is mounted as a static file directory. Individual files are accessible by URL if the path is known, but directory listing is disabled by FastAPI's `StaticFiles`. Ensure no sensitive files (non-media) are placed in the uploads directory.

- **Database not exposed publicly**: The PostgreSQL instance should not be accessible from the public internet. Use a private network, VPC, or firewall rules to restrict access to the application host only.

- **Dependency updates**: Periodically rebuild the Docker image with updated `requirements.txt` and `package.json` dependencies to pick up security patches in upstream libraries.

---

## 16. Troubleshooting

### Database connection failures

**Symptom**: Entrypoint logs show repeated `Database connection failed` messages. The process exits before uvicorn starts. Health check is unreachable.

**Diagnosis**:
- Confirm `DATABASE_URL` is set and correctly formatted.
- Confirm the PostgreSQL host is reachable from the container's network.
- Check for `postgres://` vs `postgresql://` — the app normalises this automatically, but verify the scheme.
- Check SSL requirements: Railway PostgreSQL requires `?sslmode=require`. The app appends this automatically when `DATABASE_URL` is present as an environment variable, but confirm this is not being overridden.

**Resolution**:
```bash
# Test connectivity from the container
docker exec -it streamflow psql "$DATABASE_URL" -c "SELECT 1"

# From Fly.io
fly ssh console --app streamflow-app
psql "$DATABASE_URL" -c "SELECT 1"
```

---

### Uploads directory not writable

**Symptom**: Health endpoint returns `{"status": "degraded", "checks": {"uploads": "error: directory missing or not writable"}}`.

**Diagnosis**:
- The volume is not mounted, or it is mounted at a different path than the application expects.
- The container process (`streamflow_user`) does not have write permission on the mounted directory.

**Resolution**:
- Verify the volume mount is present in the `docker run` command or `fly.toml`.
- For Docker bind mounts, check host directory permissions:
  ```bash
  ls -la /data/streamflow/
  # Ensure the directory is writable by UID 1000
  chown -R 1000:1000 /data/streamflow/uploads
  ```
- For Fly.io, verify the volume is attached:
  ```bash
  fly volumes list --app streamflow-app
  fly status --app streamflow-app
  ```

---

### Health check returning 503

**Symptom**: Load balancer marks the backend as unhealthy. The `/health` endpoint returns HTTP 503.

**Diagnosis**: Read the `checks` object in the response body to identify which check is failing:
```bash
curl -s https://your-domain/health | python -m json.tool
```

Address the specific failing check using the database or uploads guidance above.

---

### Migration failures

**Symptom**: Entrypoint logs show `Migration failed`. The process exits.

**Common causes and resolutions**:

- **Database unreachable during migration**: The migration runs before the setup script's retry logic. If the database is briefly unavailable at the moment the entrypoint runs, the migration fails. On platforms with health-check-gated startup (Fly.io), the database should be ready; on Railway, the PostgreSQL plugin may take a moment to start. Resolution: redeploy — the race condition is transient.

- **Migration conflict**: A manual schema change was applied directly to the database, creating a state that conflicts with the Alembic migration graph. Resolution: inspect with `alembic current` and `alembic history`, then manually mark the conflicting revision as applied with `alembic stamp <revision>` after verifying the schema is correct.

- **`DuplicateColumn` or `already exists` error**: `setup_production.py` detects these and treats them as no-ops. If the main `alembic upgrade head` in the entrypoint encounters them, check whether a migration was applied out of order or a column was added manually. The setup script's `run_migrations()` handles these gracefully, but the entrypoint's direct `alembic upgrade head` call does not — a failure here exits the process.

---

### SECRET_KEY validation rejection

**Symptom**: Container starts and immediately exits. Logs contain:

```
CRITICAL app.main: FATAL: SECRET_KEY is missing, too short, or still set to a default value.
```

**Resolution**: Set a valid `SECRET_KEY`:
```bash
openssl rand -hex 32
```

Set the output as the `SECRET_KEY` environment variable or secret. Known rejected values include:
- Empty string
- `change-this-in-production`
- `your-super-secret-jwt-key-change-this-in-production`
- Any value shorter than 32 characters

---

### Port conflicts (self-hosted Docker)

**Symptom**: `docker run` fails with `bind: address already in use` for port 8000.

**Resolution**: Either stop the conflicting process, or map the container to a different host port:
```bash
docker run -p 9000:8000 ...
```
Update your reverse proxy upstream accordingly.
