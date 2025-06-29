from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
import os
import time
from pathlib import Path
from .database import engine, Base
from .api import auth, songs, playlists, streaming, admin, upload
from .config import settings

# Ensure uploads directory exists
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

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

@app.get("/")
async def root():
    return {
        "message": "Welcome to StreamFlow API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}