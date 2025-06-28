#!/usr/bin/env python3
"""
Orchestration script to start all StreamFlow services
"""
import multiprocessing
import time
import sys
import os
import subprocess
import socket
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

def is_port_in_use(port):
    """Check if a port is in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except OSError:
            return True

def kill_process_on_port(port):
    """Kill process using a specific port"""
    try:
        if sys.platform.startswith('win'):
            # Windows: use netstat to find PID and taskkill to kill it
            result = subprocess.run(
                ['netstat', '-ano'], 
                capture_output=True, 
                text=True, 
                shell=True
            )
            
            for line in result.stdout.split('\n'):
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        try:
                            subprocess.run(['taskkill', '/PID', pid, '/F'], 
                                         capture_output=True, shell=True)
                            print(f"✅ Killed process {pid} on port {port}")
                            return True
                        except:
                            pass
        else:
            # Unix/Linux: use lsof to find PID and kill to kill it
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'], 
                capture_output=True, 
                text=True
            )
            
            if result.stdout.strip():
                pid = result.stdout.strip()
                subprocess.run(['kill', '-9', pid], capture_output=True)
                print(f"✅ Killed process {pid} on port {port}")
                return True
                
    except Exception as e:
        print(f"⚠️  Warning: Could not kill process on port {port}: {e}")
    
    return False

def check_and_kill_existing_servers():
    """Check for and kill existing servers on required ports"""
    ports_to_check = [8000, 8081, 5173]
    ports_in_use = []
    
    print("🔍 Checking for existing servers...")
    
    for port in ports_to_check:
        if is_port_in_use(port):
            ports_in_use.append(port)
            print(f"⚠️  Port {port} is in use")
    
    if ports_in_use:
        print("\n🛑 Found existing servers. Stopping them...")
        for port in ports_in_use:
            kill_process_on_port(port)
            time.sleep(1)  # Give time for process to terminate
        
        print("✅ Existing servers stopped")
    else:
        print("✅ No existing servers found")
    
    print()

def start_backend_process():
    """Start the backend server in a separate process"""
    from start_backend import start_backend
    start_backend()

def start_admin_process():
    """Start the admin server in a separate process"""
    from start_admin import main as start_admin_server
    start_admin_server()

def start_frontend_process():
    """Start the frontend server in a separate process"""
    from start_frontend import start_frontend
    start_frontend()

def main():
    print("🎵 StreamFlow Development Environment")
    print("=" * 50)
    
    # Check and kill existing servers first
    check_and_kill_existing_servers()
    
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
    print("📍 Admin Page: http://localhost:8081/admin.html")
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