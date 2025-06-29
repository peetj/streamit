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

# Ensure uploads directory exists
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Ensure static directory exists
static_dir = Path("app/static")
static_dir.mkdir(exist_ok=True)

app = FastAPI(
    title="StreamFlow API",
    description="A music streaming API with user authentication, file upload, and playlist management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

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