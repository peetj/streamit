#!/usr/bin/env python3
"""
Start the StreamFlow FastAPI backend server
"""
import uvicorn
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

def start_backend():
    print("🚀 Starting StreamFlow Backend Server...")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("📍 API Base URL: http://localhost:8000")
    print("📍 Health Check: http://localhost:8000/health")
    print("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    start_backend() 