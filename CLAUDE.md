# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StreamFlow is a self-hosted music streaming app. The backend is a FastAPI (Python) REST API; the frontend is a React/TypeScript SPA built with Vite.

## Development Commands

### Backend
```bash
# Activate virtualenv first
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run backend (from project root)
python scripts/startup/start_backend.py
# or directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Frontend
```bash
cd client
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

### Docker (Development)
```bash
docker-compose -f docker-compose.dev.yml up
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### All Services
```bash
python scripts/startup/start_all.py
```

## Architecture

### Backend (`app/`)
FastAPI app with these layers:
- **`api/`** — Route handlers: `auth`, `songs`, `playlists`, `streaming`, `upload`, `admin`
- **`models/`** — SQLAlchemy ORM: `User`, `Song`, `ListeningSession`, `Playlist`, `PlaylistSong`
- **`schemas/`** — Pydantic v2 request/response models
- **`services/`** — Business logic: `auth_service` (JWT), `file_service` (upload/delete), `metadata_service` (Mutagen extraction)
- **`config.py`** — Pydantic settings loaded from environment variables
- **`database.py`** — SQLAlchemy engine and session factory

Key behaviors:
- Tables are auto-created via SQLAlchemy on startup (no manual `CREATE TABLE` needed for new installs)
- Audio files are served via range requests (`streaming.py`) for seek support
- `ListeningSession` records track play history
- `PlaylistSong` has a `position` field for drag-and-drop ordering

### Frontend (`client/src/`)
- **`components/`** — All UI: `Player.tsx`, `Sidebar.tsx`, `LibraryPage.tsx`, `LikedSongsPage.tsx`, `ProfilePage.tsx`, etc.
- **`services/`** — API client functions (axios/fetch wrappers)
- **`hooks/`** — Custom hooks: `useAuth`, `usePlayer`, etc.
- **`config/api.ts`** — Backend URL configuration (change this for different environments)

In development, Vite proxies `/api` requests to `http://localhost:8000`, so the frontend only needs to hit its own origin.

### File Storage
Uploads live in `uploads/audio/`, `uploads/artwork/`, `uploads/profile/` (created at startup). The `/uploads` path is mounted as a static directory by FastAPI.

### Database
PostgreSQL. Key relationships:
- `User` → many `Song` (uploader), many `Playlist` (owner)
- `Playlist` ↔ `Song` via `PlaylistSong` join table (ordered by `position`)
- `User` ↔ `Song` (liked) via `liked_songs` association table
- `ListeningSession` links `User`, `Song`, and optionally `Playlist`

## Environment Variables

Copy `env.example` to `.env`. Required vars:
```
DATABASE_URL=postgresql://user:pass@host/dbname
SECRET_KEY=<random-secret>
PORT=8000
UPLOAD_DIR=./uploads
```

Optional:
```
REDIS_URL=redis://localhost:6379
UNSPLASH_ACCESS_KEY=...
FLICKR_API_KEY=...
LASTFM_API_KEY=...
```

## Default Credentials (dev only)
- Admin: `admin@streamflow.com` / `admin123`
- Test user: `test@streamflow.com` / `test123`

Run `python scripts/deployment/setup_production.py` to create these on a fresh deployment.

## Deployment

- **Railway**: push to GitHub, Railway builds via Nixpacks, post-deploy runs `setup_production.py`
- **Fly.io**: `fly deploy` using `fly.toml`; uses Docker, persistent volume for uploads
- **Docker (self-hosted)**: `docker build` with `Dockerfile` (single container, serves built frontend as static files from FastAPI)

In the production Docker build, the React app is compiled and served as static files by FastAPI — there is no separate Node process.
