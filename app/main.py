from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import time
import subprocess
from pathlib import Path
from .database import engine, Base
from .api import auth, songs, playlists, streaming, admin, upload
from .config import settings

# Ensure uploads directory exists with error handling
def create_directory_safely(path: Path, name: str):
    """Safely create a directory with error handling for production environments"""
    try:
        path.mkdir(exist_ok=True)
        print(f"✅ {name} directory created/verified: {path}")
    except PermissionError as e:
        print(f"❌ Permission error creating {name} directory: {e}")
        print(f"⚠️ {name} directory creation failed - this may cause upload issues")
    except Exception as e:
        print(f"❌ Error creating {name} directory: {e}")
        print(f"⚠️ {name} directory creation failed - this may cause upload issues")

uploads_dir = Path("uploads")
create_directory_safely(uploads_dir, "uploads")

# Ensure upload subdirectories exist
audio_dir = uploads_dir / "audio"
create_directory_safely(audio_dir, "audio")

artwork_dir = uploads_dir / "artwork"
create_directory_safely(artwork_dir, "artwork")

profile_dir = uploads_dir / "profile"
create_directory_safely(profile_dir, "profile")

# Ensure static directory exists
static_dir = Path("app/static")
create_directory_safely(static_dir, "static")

# --- Startup secret validation ---
_INSECURE_DEFAULTS = {"change-this-in-production", "your-super-secret-jwt-key-change-this-in-production", ""}
_secret = settings.secret_key.strip()
if _secret in _INSECURE_DEFAULTS or len(_secret) < 32:
    import sys
    print(
        "\n❌ FATAL: SECRET_KEY is missing, too short, or still set to a default value.\n"
        "   Generate one with:  openssl rand -hex 32\n"
        "   Then set it as the SECRET_KEY environment variable.\n"
    )
    sys.exit(1)

app = FastAPI(
    title="StreamFlow API",
    description="A music streaming API with user authentication, file upload, and playlist management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log request details to help debug HTTPS/HTTP issues"""
    print(f"🔍 REQUEST: {request.method} {request.url}")
    print(f"🔍 PROTOCOL: {request.url.scheme}")
    print(f"🔍 HEADERS: {dict(request.headers)}")
    print(f"🔍 CLIENT: {request.client}")
    print(f"🔍 ENVIRONMENT: RAILWAY_ENV={os.getenv('RAILWAY_ENVIRONMENT')}, PORT={os.getenv('PORT')}")
    
    response = await call_next(request)
    
    print(f"🔍 RESPONSE: {response.status_code}")
    print(f"🔍 RESPONSE HEADERS: {dict(response.headers)}")
    
    return response

# CORS middleware — set CORS_ORIGINS env var to a comma-separated list of allowed
# origins in production (e.g. "https://app.example.com"). Defaults to "*" (open).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_origins_list != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/admin", StaticFiles(directory="admin"), name="admin")

# Templates
templates = Jinja2Templates(directory="app/static")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(songs.router, prefix="/api/songs", tags=["Songs"])
app.include_router(playlists.router, prefix="/api/playlists", tags=["Playlists"])
app.include_router(streaming.router, prefix="/api/stream", tags=["Streaming"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])  # Admin cleanup endpoints
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup with retry logic"""
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempting to connect to database (attempt {attempt + 1}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created successfully")
            
            # Run production setup if in Railway environment
            if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("DATABASE_URL"):
                print("🚀 Running production setup...")
                try:
                    result = subprocess.run(["python", "scripts/deployment/setup_production.py"],
                                          capture_output=True, text=True, timeout=60)
                    if result.returncode == 0:
                        print("✅ Production setup completed successfully")
                    else:
                        print(f"⚠️ Production setup failed with return code {result.returncode}")
                        print(f"📄 STDOUT: {result.stdout}")
                        print(f"❌ STDERR: {result.stderr}")
                except subprocess.TimeoutExpired:
                    print("⚠️ Production setup timed out after 60 seconds")
                except Exception as e:
                    print(f"⚠️ Production setup failed with exception: {e}")
            
            return
        except Exception as e:
            print(f"❌ Failed to create database tables (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print("❌ All database connection attempts failed. Application will start without database tables.")
                print("💡 Make sure your DATABASE_URL environment variable is set correctly in Railway.")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the API landing page"""
    try:
        with open("app/static/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        # Fallback to JSON if HTML file not found
        return {
            "message": "Welcome to StreamFlow API",
            "docs": "/docs",
            "version": "1.0.0"
        }



@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Custom exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Handle 404 errors with custom page"""
    try:
        with open("app/static/404.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=404)
    except FileNotFoundError:
        # Fallback to JSON response
        return {"error": "Not Found", "message": "The requested resource was not found"}

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: HTTPException):
    """Handle 500 errors with custom page"""
    try:
        with open("app/static/error.html", "r", encoding="utf-8") as f:
            content = f.read()
            # Replace template variables
            content = content.replace("{{ status_code }}", "500")
            content = content.replace("{{ title }}", "Internal Server Error")
            content = content.replace("{{ message }}", "Something went wrong on our end. Please try again later.")
            return HTMLResponse(content=content, status_code=500)
    except FileNotFoundError:
        # Fallback to JSON response
        return {"error": "Internal Server Error", "message": "Something went wrong"}

@app.exception_handler(403)
async def forbidden_handler(request: Request, exc: HTTPException):
    """Handle 403 errors with custom page"""
    try:
        with open("app/static/error.html", "r", encoding="utf-8") as f:
            content = f.read()
            # Replace template variables
            content = content.replace("{{ status_code }}", "403")
            content = content.replace("{{ title }}", "Forbidden")
            content = content.replace("{{ message }}", "You don't have permission to access this resource.")
            return HTMLResponse(content=content, status_code=403)
    except FileNotFoundError:
        # Fallback to JSON response
        return {"error": "Forbidden", "message": "Access denied"}