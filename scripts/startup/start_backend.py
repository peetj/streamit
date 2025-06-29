#!/usr/bin/env python3
"""
Start the StreamFlow FastAPI backend server
"""
import uvicorn
import sys
import os
from pathlib import Path

# Add the scripts directory to the Python path to import utils
scripts_dir = Path(__file__).parent.parent
sys.path.insert(0, str(scripts_dir))

# Import utils from the utilities directory
from utilities.utils import find_project_root

# Add the project root to Python path
project_root = find_project_root()
sys.path.insert(0, str(project_root))

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