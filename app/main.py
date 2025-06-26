from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, Base
from .api import auth, songs, playlists, streaming, admin
from .config import settings

# Create tables
Base.metadata.create_all(bind=engine)

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