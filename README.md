# StreamFlow Backend

A FastAPI-based backend for the StreamFlow music streaming application.

## Features

- User authentication with JWT tokens
- Music file upload and metadata extraction
- Audio streaming with range request support
- Playlist management
- Album art extraction and serving
- PostgreSQL database with SQLAlchemy ORM
- Database migrations with Alembic

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Install PostgreSQL and create database
createdb streamflow_music

# Create user (optional)
psql -c "CREATE USER streamflow_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE streamflow_music TO streamflow_user;"
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 4. Database Migration

```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head
```

### 5. Create Upload Directories

```bash
mkdir -p uploads/audio
mkdir -p uploads/artwork
```

### 6. Run the Server

```bash
# Development
python run.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Songs
- `POST /api/songs/upload` - Upload audio file
- `GET /api/songs/` - List user's songs
- `GET /api/songs/{song_id}` - Get song details
- `DELETE /api/songs/{song_id}` - Delete song

### Playlists
- `POST /api/playlists/` - Create playlist
- `GET /api/playlists/` - List user's playlists
- `GET /api/playlists/{playlist_id}` - Get playlist details
- `PUT /api/playlists/{playlist_id}` - Update playlist
- `DELETE /api/playlists/{playlist_id}` - Delete playlist
- `POST /api/playlists/{playlist_id}/songs` - Add song to playlist
- `DELETE /api/playlists/{playlist_id}/songs/{song_id}` - Remove song from playlist

### Streaming
- `GET /api/stream/song/{song_id}` - Stream audio file
- `GET /api/stream/album-art/{song_id}` - Get album artwork

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app setup
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── song.py
│   │   └── playlist.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── song.py
│   │   └── playlist.py
│   ├── api/                 # API routes
│   │   ├── auth.py
│   │   ├── songs.py
│   │   ├── playlists.py
│   │   └── streaming.py
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   ├── file_service.py
│   │   └── metadata_service.py
│   └── utils/               # Utilities
│       └── security.py
├── alembic/                 # Database migrations
├── uploads/                 # File storage
├── requirements.txt
├── .env.example
└── run.py
```

## Development

### Adding New Features

1. Create models in `app/models/`
2. Create schemas in `app/schemas/`
3. Create API routes in `app/api/`
4. Add business logic in `app/services/`
5. Create database migration: `alembic revision --autogenerate -m "Description"`
6. Run migration: `alembic upgrade head`

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Production Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Gunicorn

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Security Considerations

- Change default JWT secret key
- Use HTTPS in production
- Implement rate limiting
- Validate file uploads thoroughly
- Use environment variables for sensitive data
- Regular security updates

## Performance Optimization

- Use Redis for caching
- Implement database connection pooling
- Use CDN for file serving
- Optimize database queries
- Implement background job processing

### Installing  & Running PostgreSQL
When I installed v17, I found that I couldn't start the DB. I tried pretty much everything:
- The pgAdmin tool (had to connect to server but didn't know password)
- gitbash with various commands to start the psql command (psql -U postres -d postgres)
- bash with the above
- SQL Shell (psql) accepting all the defaults
- In ALL cases it was expecting a password which I hadn't set and didn't know
- Searched all the forums and got a bunch of old posts
- Asked Cursor IDE and ChatGPT (several times and several ways)
- Finally got an answer - I had to change the config file: 
C:\Program Files\PostgreSQL\17\data\pg_hba.conf

The change is to make all of the login methods trustable by commenting out the current method, which in my case was 'scram-sha-256' to 'trust'. The best way to do this is comment out all the lines and copy them and change them.

Then login with the password from bash:
psql -U postgress -d postgres

Then change the DB the password in the psql tool shell:

ALTER USER postgres WITH PASSWORD 'your_new_password';
\q

Reopen pg_hba.conf and change all the trust lines back to scram-sha-256, then restart PostgreSQL again.

Now you can log in securely using the new password.


### RUNNING Alembic
NOTE: You will need to grant privileges to your streamflow_user to the public schema if you want to do the Alembic migrations successfully:

GRANT ALL PRIVILEGES ON SCHEMA public TO streamflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO streamflow_user;
GRANT CREATE ON SCHEMA public TO streamflow_user;

Then you can try:
alembic upgrade head

### RUNNING fastapi server with `python run.py`
This fell over too. I had to install pydantic[email] with:

pip install pydantic[email]

which I added to requirements.txt as well to fix it for others later.

I finally got this when starting run.py:

NEXGEN-01:streamit$ python run.py
INFO:     Will watch for changes in these directories: ['C:\\Users\\Peter Januarius\\Documents\\working_projects\\streamit']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [29828] using WatchFiles
INFO:     Started server process [14908]
INFO:     Waiting for application startup.
INFO:     Application startup complete.

SUCCESS !!