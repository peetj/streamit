#!/usr/bin/env python3
"""
Orchestration script to start all StreamFlow services
"""
import multiprocessing
import time
import sys
import os
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

def start_backend_process():
    """Start the backend server in a separate process"""
    from start_backend import start_backend
    start_backend()

def start_admin_process():
    """Start the admin server in a separate process"""
    from start_admin import start_admin_server
    start_admin_server()

def start_frontend_process():
    """Start the frontend server in a separate process"""
    from start_frontend import start_frontend
    start_frontend()

def main():
    print("🎵 StreamFlow Development Environment")
    print("=" * 50)
    print("Starting all services...")
    print()
    
    # Create processes for each service
    processes = []
    
    # Start backend
    print("🚀 Starting Backend...")
    backend_process = multiprocessing.Process(target=start_backend_process, name="Backend")
    backend_process.start()
    processes.append(backend_process)
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start admin server
    print("🔧 Starting Admin Server...")
    admin_process = multiprocessing.Process(target=start_admin_process, name="Admin")
    admin_process.start()
    processes.append(admin_process)
    
    # Wait a moment for admin to start
    time.sleep(1)
    
    # Start frontend
    print("🎨 Starting Frontend...")
    frontend_process = multiprocessing.Process(target=start_frontend_process, name="Frontend")
    frontend_process.start()
    processes.append(frontend_process)
    
    print()
    print("✅ All services started!")
    print("=" * 50)
    print("📍 Backend API: http://localhost:8000")
    print("📍 API Docs: http://localhost:8000/docs")
    print("📍 Admin Page: http://localhost:8080/admin.html")
    print("📍 Frontend: http://localhost:5173")
    print("=" * 50)
    print("Press Ctrl+C to stop all services")
    
    try:
        # Keep the main process alive
        while True:
            time.sleep(1)
            # Check if any process has died
            for process in processes:
                if not process.is_alive():
                    print(f"❌ {process.name} process died unexpectedly")
                    return
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
        
        # Terminate all processes
        for process in processes:
            if process.is_alive():
                process.terminate()
                process.join(timeout=5)
                if process.is_alive():
                    process.kill()
        
        print("✅ All services stopped")

if __name__ == "__main__":
    # Set multiprocessing start method for Windows compatibility
    if sys.platform.startswith('win'):
        multiprocessing.set_start_method('spawn')
    
    main() 