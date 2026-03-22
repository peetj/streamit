# StreamFlow Developer Guide

A practical reference for engineers contributing to or extending the StreamFlow codebase.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Local Development Setup](#2-local-development-setup)
3. [Backend Code Structure](#3-backend-code-structure)
4. [Frontend Code Structure](#4-frontend-code-structure)
5. [Database](#5-database)
6. [Authentication Flow](#6-authentication-flow)
7. [Audio Streaming](#7-audio-streaming)
8. [Adding a New API Endpoint](#8-adding-a-new-api-endpoint)
9. [Adding a New Frontend Page](#9-adding-a-new-frontend-page)
10. [Logging](#10-logging)
11. [Common Development Commands](#11-common-development-commands)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Architecture Overview

StreamFlow is split into two independent processes that communicate over HTTP:

- **Backend**: A FastAPI (Python) REST API running on port 8000.
- **Frontend**: A React + TypeScript SPA built with Vite, running on port 5173 in development and 3000 in Docker dev mode.

### Request flow in development

```
Browser → Vite dev server (5173)
              └── /api/* requests → proxied to FastAPI (8000)
              └── static assets → served directly by Vite
```

Vite proxies all `/api` requests to `http://localhost:8000`, so the frontend only ever talks to its own origin. This avoids CORS issues locally.

### Request flow in production (Docker / single container)

```
Browser → FastAPI (8000)
              ├── /api/*      → route handlers
              ├── /uploads/*  → StaticFiles (audio, artwork, profile images)
              ├── /assets/*   → React build output (JS/CSS bundles)
              └── /*          → SPA catch-all: serves frontend/index.html
```

In the production Docker build, `npm run build` compiles the React app into `frontend/`, which FastAPI then serves as static files. There is no separate Node process in production.

### Layer structure (backend)

```
HTTP Request
  └── FastAPI router (app/api/)
        └── Pydantic schema validation (app/schemas/)
              └── Service / business logic (app/services/)
                    └── SQLAlchemy ORM (app/models/)
                          └── PostgreSQL
```

Each router delegates to a service where logic is non-trivial. Simple CRUD endpoints often query the database directly inside the route handler for brevity.

---

## 2. Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (local instance or a cloud connection string)
- Git

### Step-by-step

**1. Clone the repository**

```bash
git clone <repo-url>
cd streamit
```

**2. Set up the Python virtual environment**

```bash
python -m venv venv

# Activate (Windows Git Bash / WSL)
source venv/Scripts/activate

# Activate (macOS / Linux)
source venv/bin/activate
```

**3. Install Python dependencies**

```bash
pip install -r requirements.txt
```

Key dependencies include `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `python-jose` (JWT), `passlib[bcrypt]` (password hashing), `mutagen` (audio metadata), `Pillow` (image processing), and `slowapi` (rate limiting).

**4. Configure environment variables**

```bash
cp env.example .env
```

Open `.env` and fill in the required values:

```env
DATABASE_URL=postgresql://streamflow_user:your_password@localhost/streamflow_music
SECRET_KEY=<generate with: openssl rand -hex 32>
PORT=8000
UPLOAD_DIR=./uploads
```

The app will refuse to start if `SECRET_KEY` is missing, shorter than 32 characters, or still set to a known default value. This check runs at import time in `app/main.py`.

Optional variables:

```env
LOG_LEVEL=DEBUG          # DEBUG | INFO | WARNING | ERROR | CRITICAL
CORS_ORIGINS=*           # Comma-separated allowed origins in production
REDIS_URL=redis://localhost:6379
```

**5. Create the database and run migrations**

```bash
# Create the PostgreSQL database (if not already created)
createdb streamflow_music

# Apply all migrations
alembic upgrade head
```

**6. (Optional) Seed development accounts**

```bash
python scripts/deployment/setup_production.py
```

This creates `admin@streamflow.com / admin123` and `test@streamflow.com / test123`. Do not use these credentials in any environment exposed to the internet.

**7. Start the backend**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag watches for file changes and restarts the server automatically. API docs are available at `http://localhost:8000/docs`.

**8. Install frontend dependencies and start the dev server**

```bash
cd client
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173` with hot module replacement (HMR) enabled.

---

## 3. Backend Code Structure

```
app/
├── main.py              # FastAPI app, middleware, router registration, startup
├── config.py            # Pydantic settings loaded from environment
├── database.py          # SQLAlchemy engine, session factory, get_db dependency
├── logging_config.py    # Logging setup
├── api/                 # Route handlers (one file per feature)
│   ├── auth.py
│   ├── songs.py
│   ├── playlists.py
│   ├── streaming.py
│   ├── upload.py
│   └── admin.py
├── models/              # SQLAlchemy ORM models
│   ├── user.py
│   ├── song.py
│   └── playlist.py
├── schemas/             # Pydantic request/response models
│   ├── user.py
│   ├── song.py
│   └── playlist.py
├── services/            # Business logic
│   ├── auth_service.py
│   ├── file_service.py
│   └── metadata_service.py
└── utils/
    └── security.py      # Password hashing and JWT token creation
```

### `app/main.py`

The application entry point. It:

- Calls `configure_logging()` before anything else.
- Validates `SECRET_KEY` at startup and calls `sys.exit(1)` if it is insecure.
- Creates an `APIRouter`-based `FastAPI` app with CORS middleware, a `slowapi` rate limiter, and static file mounts for `/uploads`, `/static`, and `/admin`.
- Registers all routers under `/api/*` prefixes.
- On startup, calls `Base.metadata.create_all()` with retry/backoff logic to create any missing tables.
- Serves the React SPA's `index.html` as a catch-all for non-API paths when `frontend/index.html` exists (production only).

### `app/config.py`

Uses `pydantic-settings` (`BaseSettings`) to load configuration from environment variables and `.env`. The `settings` singleton is imported across the codebase. Key fields:

| Field | Env var | Default |
|---|---|---|
| `database_url` | `DATABASE_URL` | local PostgreSQL URL |
| `secret_key` | `SECRET_KEY` | `"change-this-in-production"` |
| `algorithm` | — | `"HS256"` |
| `access_token_expire_minutes` | — | `30` |
| `upload_dir` | `UPLOAD_DIR` | `"./uploads"` |
| `max_file_size` | — | `50000000` (50 MB) |
| `allowed_extensions` | — | `["mp3", "wav", "flac", "m4a"]` |
| `cors_origins` | `CORS_ORIGINS` | `"*"` |
| `log_level` | `LOG_LEVEL` | `"INFO"` |

The `cors_origins_list` property parses the comma-separated `CORS_ORIGINS` string into a list for FastAPI's `CORSMiddleware`.

### `app/database.py`

Creates the SQLAlchemy `engine` using the SSL-aware `settings.database_url_with_ssl` property (handles Railway's `postgres://` prefix and SSL requirements), then exposes:

- `SessionLocal`: a session factory used by route handlers.
- `Base`: the declarative base that all ORM models inherit from.
- `get_db()`: a FastAPI dependency that yields a database session and closes it when the request finishes.

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### `app/logging_config.py`

Reads `settings.log_level` and configures `logging.basicConfig` with a consistent format:

```
2026-03-22 14:05:01 INFO app.api.songs: GET /api/songs/ called
```

All modules should obtain a logger with `logging.getLogger(__name__)` rather than using `print()`. See [Section 10](#10-logging).

### `app/api/`

Each file defines one `APIRouter` that is registered in `main.py`:

| File | Prefix | Purpose |
|---|---|---|
| `auth.py` | `/api/auth` | Register, login, get current user |
| `songs.py` | `/api/songs` | List, upload, delete, like, play count, listening sessions |
| `playlists.py` | `/api/playlists` | CRUD playlists, add/remove/reorder songs |
| `streaming.py` | `/api/stream` | Stream audio (range requests), stream album art |
| `upload.py` | `/api/upload` | Upload profile images |
| `admin.py` | `/api/admin` | Admin-only cleanup and management endpoints |

Every protected route injects `current_user: User = Depends(get_current_user)`. Admin-only routes use `Depends(get_current_admin_user)` instead.

### `app/models/`

SQLAlchemy ORM model definitions. Each model inherits from `Base` and defines columns and relationships. Tables are created automatically on startup via `Base.metadata.create_all()`. See [Section 5](#5-database) for the full model reference.

### `app/schemas/`

Pydantic v2 models used for request body validation and response serialization. The pattern is:

- `*Base` — shared fields
- `*Create` — fields required to create a resource
- `*Response` — fields returned to the client (includes `id`, `created_at`, etc.)

All `*Response` schemas set `model_config = ConfigDict(from_attributes=True)` (or the v1 equivalent `class Config: from_attributes = True`) so SQLAlchemy ORM objects can be passed directly to them.

### `app/services/`

**`auth_service.py`** — Provides three FastAPI dependencies:

- `get_current_user`: decodes the JWT, looks up the user in the database, returns the `User` ORM object.
- `get_current_active_user`: wraps `get_current_user`, additionally checks `is_active`.
- `get_current_admin_user`: wraps `get_current_user`, additionally checks `role == "admin"`.

**`file_service.py`** — `FileService` handles audio file persistence:

- `is_valid_audio_file(filename)`: checks the file extension against `settings.allowed_extensions`.
- `save_uploaded_file(file, user_id)`: saves an `UploadFile` to `uploads/audio/<user_id>/<uuid>.<ext>` with permission error handling.
- `delete_file(file_path)`: deletes a file from disk, returns `bool`.

**`metadata_service.py`** — `MetadataService` wraps Mutagen:

- `extract_metadata(file_path)`: reads ID3v2, Vorbis, and MP4 tags to return a dict with `title`, `artist`, `album`, `year`, `genre`, `duration`, `bitrate`, and `sample_rate`.
- `extract_album_art(file_path, output_dir)`: extracts embedded artwork, converts it to JPEG via Pillow (resizing to max 500x500), and saves it to `output_dir`. Returns the saved path or `None`.

### `app/utils/security.py`

Low-level cryptography helpers used by `auth.py`:

- `get_password_hash(password)`: bcrypt hash via passlib.
- `verify_password(plain, hashed)`: bcrypt verify.
- `create_access_token(data, expires_delta)`: encodes a JWT with `python-jose` using `settings.secret_key` and `settings.algorithm` (`HS256`).

---

## 4. Frontend Code Structure

```
client/src/
├── App.tsx              # Root component, view routing, shared state
├── main.tsx             # React entry point, ReactDOM.createRoot
├── types/
│   └── index.ts         # Shared TypeScript interfaces
├── config/
│   └── api.ts           # API URL config, auth headers, fetch helpers
├── hooks/
│   ├── useAuth.ts       # Authentication state and actions
│   └── usePlayer.ts     # Playback state, queue, persistence
├── services/
│   ├── songService.ts   # Song API calls
│   └── playlistService.ts  # Playlist API calls
└── components/          # All UI components
    ├── Player.tsx
    ├── Sidebar.tsx
    ├── LibraryPage.tsx
    ├── LikedSongsPage.tsx
    ├── ProfilePage.tsx
    ├── SettingsPage.tsx
    ├── AuthPage.tsx
    └── ...
```

### `client/src/types/index.ts`

Defines the TypeScript interfaces shared across the application:

- `Song` — `id`, `title`, `artist`, `album`, `duration` (seconds), `url`, `albumArt?`, `genre?`, `year?`
- `Playlist` — `id`, `name`, `description?`, `songs: Song[]`, `coverImage?`, `createdAt`, `updatedAt`
- `User` — `id`, `username`, `email`, `avatar?`, `playlists: Playlist[]`
- `PlayerState` — `currentSong`, `isPlaying`, `progress` (0–100), `volume` (0–100), `queue`, `shuffle`, `repeat` (`'none' | 'one' | 'all'`), `currentPlaylist`, `currentIndex`

### `client/src/config/api.ts`

Central configuration for all API communication. Key exports:

**`API_CONFIG`** — object containing `BACKEND_URL` (read from `VITE_BACKEND_URL` env var, defaults to `http://localhost:8000`), optional third-party API keys, and an `ENDPOINTS` map of all API paths.

```typescript
API_CONFIG.ENDPOINTS.SONGS.STREAM(id)  // → "/api/stream/song/<id>/"
API_CONFIG.ENDPOINTS.AUTH.LOGIN        // → "/api/auth/login/"
```

**`getApiUrl(endpoint)`** — prepends `API_CONFIG.BACKEND_URL` to a path.

**`getAuthHeaders()`** — reads `streamflow_token` from `localStorage` and returns headers including `Authorization: Bearer <token>`.

**`apiRequest(endpoint, options)`** — a thin wrapper around `fetch` that automatically applies auth headers. Most service functions use this.

To add a new endpoint, add its path to the `ENDPOINTS` object in this file.

### `client/src/hooks/useAuth.ts`

Manages authentication state. On mount, it checks `localStorage` for `streamflow_token` and calls `GET /api/auth/me/` to validate the token and hydrate the `user` state. Exposes:

- `user: User | null`
- `loading: boolean`
- `error: string | null`
- `login(email, password)` — POSTs to `/api/auth/login/`, stores the returned token in `localStorage`, then fetches the user profile.
- `register(username, email, password)` — POSTs to `/api/auth/register/`.
- `logout()` — removes `streamflow_token` from `localStorage` and clears `user`.
- `clearError()` — resets the `error` state.

### `client/src/hooks/usePlayer.ts`

Manages the audio player state. Player state is persisted to `localStorage` under the key `streamflow_player`. The persisted fields are: `currentSong`, `queue`, `currentIndex`, `currentPlaylist`, `shuffle`, `repeat`, `volume`. On load, `isPlaying` and `progress` are always reset to `false` and `0` respectively — the app never auto-plays on refresh.

Key actions:

- `playSong(song)` — sets a single song as current, calls `POST /api/songs/<id>/play/` to increment the play count.
- `playPlaylist(playlist, startIndex)` — loads the full song list into the queue and starts at `startIndex`.
- `nextSong()` / `previousSong()` — advances the queue respecting `repeat` mode.
- `toggleShuffle()` — Fisher-Yates shuffles the queue in place; disabling restores the original playlist order.
- `toggleRepeat()` — cycles through `none → all → one → none`.

### `client/src/services/songService.ts`

API client functions for songs. Each function constructs the URL from `API_CONFIG`, attaches the auth token, calls `fetch`, and maps the response to the `Song` TypeScript interface. Key functions:

- `getSongs(params)` — GET with optional `search`, `genre`, `skip`, `limit` query params.
- `uploadSong(file)` — POST with `FormData` (no `Content-Type` header set manually; the browser sets it with the multipart boundary).
- `deleteSong(songId)` — DELETE.
- `likeSong(songId)` / `unlikeSong(songId)` — POST.
- `getLikedSongs()` — GET.
- `playSong(songId)` — POST (increments play count).
- `startListeningSession(songId, playlistId?)` / `completeListeningSession(songId, sessionId, durationSeconds)` — POST/PUT for tracking listen history.

### `client/src/services/playlistService.ts`

API client functions for playlists. Follows the same pattern as `songService`. Key functions: `getPlaylists`, `getPlaylist`, `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `addSongToPlaylist`, `removeSongFromPlaylist`, `reorderSongs`, `getListeningStats`.

### `client/src/App.tsx`

Root component that owns the top-level state and view routing. The app uses a simple `activeSection` string state variable instead of a URL router — `renderMainContent()` switches on this string to determine which page component to render. Pages available: `library`, `liked-songs`, `profile`, `settings`, and `playlist-<id>`.

The layout is always:
```
<Sidebar>    ←  navigation
<main>       ←  active page component
<Player>     ←  always-visible bottom bar
```

---

## 5. Database

### Technology

PostgreSQL, accessed via SQLAlchemy ORM. Alembic handles schema migrations.

### Models

#### `User` (`app/models/user.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key, auto-generated |
| `username` | String | Unique, not null |
| `email` | String | Unique, not null |
| `hashed_password` | String | bcrypt hash |
| `avatar` | String | Path to profile image |
| `is_active` | Boolean | Default `True` |
| `role` | String | `"user"` or `"admin"` |
| `created_at` / `updated_at` | DateTime | Auto-set |

#### `Song` (`app/models/song.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `title`, `artist` | String | Not null |
| `album`, `genre` | String | Nullable |
| `duration` | Float | Seconds |
| `file_path` | String | Path relative to project root |
| `file_size` | Integer | Bytes |
| `format` | String | `"mp3"`, `"flac"`, etc. |
| `bitrate`, `sample_rate` | Integer | From Mutagen |
| `year` | Integer | Nullable |
| `album_art_path` | String | Path to extracted JPEG |
| `play_count` | Integer | Default `0` |
| `uploaded_by` | String (FK → users.id) | |

Indexes exist on `title`, `artist`, and `album` to support the `ilike`-based search in `GET /api/songs/`.

#### `ListeningSession` (`app/models/song.py`)

Tracks how long a user listened to a song. `playlist_id` is optional (only set when the song was played from a playlist).

| Column | Type |
|---|---|
| `id` | String (UUID) |
| `user_id` | FK → users.id |
| `song_id` | FK → songs.id |
| `playlist_id` | FK → playlists.id (nullable) |
| `duration_seconds` | Float |
| `started_at` / `ended_at` | DateTime |

#### `Playlist` (`app/models/playlist.py`)

| Column | Type |
|---|---|
| `id` | String (UUID) |
| `name` | String |
| `description` | String (nullable) |
| `cover_image` | String (nullable) |
| `owner_id` | FK → users.id |
| `created_at` / `updated_at` | DateTime |

The `songs` property returns songs ordered by `PlaylistSong.position`:

```python
@property
def songs(self):
    return [ps.song for ps in sorted(self.playlist_songs, key=lambda ps: ps.position)]
```

#### `PlaylistSong` (`app/models/playlist.py`)

Join table between `Playlist` and `Song` that adds a `position` integer for drag-and-drop ordering.

| Column | Type |
|---|---|
| `id` | String (UUID) |
| `playlist_id` | FK → playlists.id |
| `song_id` | FK → songs.id |
| `position` | Integer |
| `added_at` | DateTime |

#### `liked_songs` (association table in `app/models/song.py`)

A plain SQLAlchemy `Table` (no class) with composite primary key `(user_id, song_id)`. Accessed via the `User.liked_songs` and `Song.liked_by` relationships.

### Key relationships

```
User ──< Song (uploaded_songs / uploader)
User ──< Playlist (playlists / owner)
User >──< Song (liked_songs, via liked_songs association table)
User ──< ListeningSession
Playlist ──< PlaylistSong ──> Song
Song ──< ListeningSession
Playlist ──< ListeningSession (optional)
```

### Alembic migrations

The project uses Alembic for incremental schema changes. Existing migrations live in `alembic/versions/`.

**Apply all pending migrations:**

```bash
alembic upgrade head
```

**Create a new migration after changing a model:**

```bash
alembic revision --autogenerate -m "add_genre_field_to_songs"
```

Alembic compares the current database schema to the SQLAlchemy metadata and generates the migration file automatically. Always review the generated file before applying it — autogenerate does not detect every change (e.g. renamed columns, server defaults).

**Useful Alembic commands:**

```bash
alembic current          # Show current revision applied to the DB
alembic history          # List all revisions
alembic downgrade -1     # Roll back one revision
alembic downgrade base   # Roll back all migrations
```

**Note on table auto-creation:** On startup, `Base.metadata.create_all()` creates any tables that do not yet exist. This is intentional for new installs without a migration history. For existing deployments, always use `alembic upgrade head` to apply changes rather than relying on `create_all`.

---

## 6. Authentication Flow

StreamFlow uses JWT (JSON Web Tokens) with the `HS256` algorithm. Tokens expire after 30 minutes.

### Token issuance

1. The client POSTs `{ email, password }` to `POST /api/auth/login/`.
2. `auth.py` queries the database for a user with the matching email.
3. `verify_password()` (passlib/bcrypt) checks the submitted password against the stored hash.
4. On success, `create_access_token()` in `app/utils/security.py` encodes `{ "sub": username, "exp": <30 min from now> }` into a JWT signed with `settings.secret_key`.
5. The response is `{ "access_token": "<jwt>", "token_type": "bearer" }`.
6. The frontend stores the token in `localStorage` under the key `streamflow_token`.

### Token verification

Every protected route uses the `get_current_user` dependency from `app/services/auth_service.py`:

```python
async def get_current_user(token: str = Depends(security), db: Session = Depends(get_db)):
    payload = jwt.decode(token.credentials, settings.secret_key, algorithms=[settings.algorithm])
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    return user
```

The `HTTPBearer` security scheme (`fastapi.security.HTTPBearer`) extracts the token from the `Authorization: Bearer <token>` header. If decoding fails or the user does not exist, a `401 Unauthorized` is raised.

### Role-based access

Two additional dependencies extend `get_current_user`:

- `get_current_active_user` — additionally checks `user.is_active`.
- `get_current_admin_user` — additionally checks `user.role == "admin"`, raises `403` otherwise.

Use `Depends(get_current_admin_user)` on any endpoint that should be restricted to admins (e.g. deleting any song, running admin cleanup).

### Frontend token lifecycle

`useAuth.ts` reads `streamflow_token` from `localStorage` on mount and calls `GET /api/auth/me/` to validate it. If the response is not `200 OK`, the token is removed and the user is redirected to the login screen. On logout, the token is removed from `localStorage` and the `user` state is set to `null`.

---

## 7. Audio Streaming

### Backend: `app/api/streaming.py`

The `GET /api/stream/song/<song_id>/` endpoint serves audio files with support for HTTP range requests, which are required for seeking in `<audio>` elements.

**Full file response** (no `Range` header):

```
HTTP 200
Content-Type: audio/mpeg
Content-Length: <file size>
Accept-Ranges: bytes
Body: full file bytes (streamed in chunks via generator)
```

**Partial content response** (with `Range: bytes=<start>-<end>`):

```
HTTP 206 Partial Content
Content-Range: bytes <start>-<end>/<total>
Content-Length: <chunk size>
Accept-Ranges: bytes
Body: requested byte range only
```

The `parse_range_header()` helper extracts `byte_start` and `byte_end` from the header. The `iterfile()` generator seeks to `byte_start` and yields 8 KB chunks until `byte_end`, keeping memory usage low regardless of file size.

The endpoint is protected by `get_current_user` — every stream request must include a valid JWT. Currently, any authenticated user can stream any song regardless of who uploaded it.

File path normalization is applied before opening the file: `./` prefixes are stripped and `uploads/` is prepended if absent.

### Frontend: audio playback

The `Player.tsx` component creates an `<audio>` element. The `src` attribute is set to the stream URL from `API_CONFIG.ENDPOINTS.SONGS.STREAM(id)` (e.g. `/api/stream/song/<id>/`). The browser sends `Range` request headers automatically when the user seeks.

Because the stream endpoint requires a `Bearer` token and HTML `<audio>` elements cannot set custom request headers natively, the player uses the stream URL directly and relies on Vite's proxy (in development) or the same-origin serving (in production) to forward cookies or include the token another way. If you need to add explicit auth headers to audio requests, the pattern is to fetch the audio as a `Blob` and create an object URL:

```typescript
const response = await fetch(streamUrl, { headers: getAuthHeaders() });
const blob = await response.blob();
const objectUrl = URL.createObjectURL(blob);
audioElement.src = objectUrl;
```

Note that blob URL approach loses range request support (no seeking until the full file is downloaded). The current implementation uses the direct URL approach which preserves seeking.

Album art is served by `GET /api/stream/album-art/<song_id>/`. The `songService.getSongs()` mapper sets `albumArt` to `${BACKEND_URL}/api/stream/album-art/${song.id}/` when `album_art_path` is present on the song record.

---

## 8. Adding a New API Endpoint

This section walks through the full pattern for adding a new endpoint, using a hypothetical `GET /api/songs/<id>/stats/` as the example.

### Step 1: Add the Pydantic response schema

In `app/schemas/song.py`, add a response model:

```python
class SongStatsResponse(BaseModel):
    song_id: str
    play_count: int
    total_listening_seconds: float

    class Config:
        from_attributes = True
```

### Step 2: Add the route handler

In `app/api/songs.py`, add the route to the existing router:

```python
from ..schemas.song import SongStatsResponse

@router.get("/{song_id}/stats/", response_model=SongStatsResponse)
async def get_song_stats(
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info("Fetching stats for song %s", song_id)
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    total_seconds = db.query(func.sum(ListeningSession.duration_seconds)) \
        .filter(ListeningSession.song_id == song_id) \
        .scalar() or 0.0

    return SongStatsResponse(
        song_id=song.id,
        play_count=song.play_count,
        total_listening_seconds=total_seconds
    )
```

### Step 3: Register in `main.py` (if it is a new router file)

If the endpoint is in an existing router file (like `songs.py`), no change to `main.py` is needed — the router is already included. If you are creating a new router file:

```python
# app/main.py
from .api import auth, songs, playlists, streaming, admin, upload, your_new_module

app.include_router(your_new_module.router, prefix="/api/your-prefix", tags=["YourTag"])
```

### Step 4: Add the endpoint path to the frontend config

In `client/src/config/api.ts`, add the path to the `ENDPOINTS` object:

```typescript
SONGS: {
  // ...existing entries...
  STATS: (id: string) => `/api/songs/${id}/stats/`,
},
```

### Step 5: Add the service function

In `client/src/services/songService.ts`:

```typescript
async getSongStats(songId: string): Promise<{ play_count: number; total_listening_seconds: number }> {
  const response = await apiRequest(API_CONFIG.ENDPOINTS.SONGS.STATS(songId));
  if (!response.ok) throw new Error('Failed to fetch song stats');
  return response.json();
},
```

### Route ordering note

FastAPI matches routes in registration order. In `songs.py`, literal path segments (e.g. `/liked/`) must be registered **before** parameterised routes (e.g. `/{song_id}/`) to avoid the parameter capturing the literal. The existing codebase adds a comment at the top of `songs.py` noting this: `# Upload routes moved to end of file to fix route order conflicts`.

---

## 9. Adding a New Frontend Page

This section demonstrates the pattern for adding a new page, using a hypothetical `StatsPage` as the example.

### Step 1: Create the component

Create `client/src/components/StatsPage.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { songService } from '../services/songService';

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Call your service function here
      // const data = await songService.getSomeStats();
      // setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stats</h1>
      {/* page content */}
    </div>
  );
};
```

### Step 2: Add the route in `App.tsx`

Import the component and add a case to `renderMainContent()`:

```typescript
import { StatsPage } from './components/StatsPage';

// Inside renderMainContent():
case 'stats':
  return <StatsPage />;
```

### Step 3: Add navigation in `Sidebar.tsx`

Add a nav item that calls `onSectionChange('stats')` when clicked. The sidebar uses the `activeSection` prop to apply active styles.

### Step 4: (Optional) Add the section to the `activeSection` initial state

`activeSection` defaults to `'library'`. No changes needed unless you want the new page to be the default.

---

## 10. Logging

All backend modules use the standard Python `logging` library. Never use `print()` for diagnostic output.

### Getting a logger

At the top of any module:

```python
import logging

logger = logging.getLogger(__name__)
```

`__name__` resolves to the dotted module path (e.g. `app.api.songs`), which appears in log output and makes it easy to filter logs by module.

### Log levels

```python
logger.debug("Detailed trace: query returned %d rows", count)
logger.info("Song %s uploaded by user %s", song_id, user_id)
logger.warning("Album art extraction failed, continuing without it")
logger.error("Database connection failed: %s", exc)
logger.critical("SECRET_KEY is insecure, refusing to start")
```

Use `%s` / `%d` style formatting (not f-strings) as arguments to the logger call. This defers string formatting until the log record is actually emitted, avoiding overhead when the log level filters the message out.

### Configuring the log level

Set `LOG_LEVEL` in `.env`:

```env
LOG_LEVEL=DEBUG   # shows all messages including debug traces
LOG_LEVEL=INFO    # default; shows info, warnings, errors
LOG_LEVEL=WARNING # only warnings and above
```

The `configure_logging()` call in `main.py` reads this setting and applies it globally via `logging.basicConfig`.

---

## 11. Common Development Commands

### Backend

```bash
# Activate virtualenv (run once per terminal session)
source venv/Scripts/activate        # Windows Git Bash
source venv/bin/activate            # macOS / Linux

# Start with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the startup script
python scripts/startup/start_backend.py

# Run both backend and frontend
python scripts/startup/start_all.py
```

### Frontend

```bash
cd client

npm run dev       # dev server at http://localhost:5173 with HMR
npm run build     # production build into client/dist/
npm run preview   # preview the production build locally
```

### Database and migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Generate a migration from model changes
alembic revision --autogenerate -m "short_description_of_change"

# Show applied revision
alembic current

# Roll back one step
alembic downgrade -1

# Show migration history
alembic history --verbose
```

### Docker (development)

```bash
# Start all services (frontend on 3000, backend on 8000)
docker-compose -f docker-compose.dev.yml up

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build
```

### Health check

```bash
curl http://localhost:8000/health
# Returns { "status": "healthy", "checks": { "database": "ok", "uploads": "ok" } }
# or { "status": "degraded", ... } with HTTP 503 if something is wrong
```

### Generate a SECRET_KEY

```bash
openssl rand -hex 32
```

---

## 12. Troubleshooting

### Application refuses to start with "FATAL: SECRET_KEY is missing..."

The startup check in `main.py` enforces that `SECRET_KEY` is set, at least 32 characters long, and not a known default. Generate a key and set it in `.env`:

```bash
openssl rand -hex 32
```

### `alembic upgrade head` fails with "can't connect to database"

Verify that `DATABASE_URL` in `.env` is correct and that PostgreSQL is running. Test the connection directly:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### `401 Unauthorized` on all API requests

The `streamflow_token` in `localStorage` may be expired (tokens last 30 minutes) or invalid. Log out and log back in. In the browser dev tools, check the `Authorization` header on outgoing requests.

### Audio does not play / 404 on stream endpoint

1. Check that the song record in the database has a valid `file_path`.
2. Check that the file actually exists at that path on disk (relative to the project root).
3. The streaming endpoint normalises paths: it strips `./` prefixes and adds `uploads/` if the path does not start with it. If your `file_path` column has an unexpected format, the normalisation may produce a wrong path.
4. Look at the backend log for the "Normalized file path" line to see what path is being opened.

### CORS errors in development

Ensure the Vite dev server proxy is configured in `client/vite.config.ts` to forward `/api` requests to `http://localhost:8000`. If you are hitting the backend directly from the browser (not via the Vite proxy), CORS errors will appear unless your `CORS_ORIGINS` setting includes the frontend origin.

### File upload fails with permission error

The backend tries to create `uploads/audio/<user_id>/` on first upload. If the process does not have write access to the project directory, this will fail. In Docker, ensure the `uploads/` volume is mounted with write permissions.

### Frontend shows a blank screen / white page

Open the browser console. Common causes:

- A JavaScript error in a component during render.
- The backend is not running and API calls are failing, causing the `useAuth` hook to clear the token and redirect to the login page — check if you are being redirected.
- A type mismatch between the API response shape and the TypeScript interface (check the `Network` tab for the raw response).

### Rate limiting returns `429 Too Many Requests`

The `register` endpoint is limited to 5 requests per minute per IP; the `login` endpoint is limited to 10 per minute. During development, if you are hitting these limits repeatedly, wait 60 seconds or restart the backend process (rate limit state is in-memory and resets on restart).

### `mutagen` not installed / metadata not extracted

If `mutagen` is missing from the virtualenv, `MetadataService` will return an empty metadata dict (`MUTAGEN_AVAILABLE` will be `False`). Songs will still upload but `title`, `artist`, and other fields will be empty. Run `pip install -r requirements.txt` to restore the dependency.
