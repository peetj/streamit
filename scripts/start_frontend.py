#!/usr/bin/env python3
"""
Start the React frontend development server
"""
import subprocess
import sys
import os
from pathlib import Path

def start_frontend():
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    client_dir = project_root / "client"
    
    if not client_dir.exists():
        print("❌ Client directory not found!")
        print(f"Expected location: {client_dir}")
        return
    
    print("🎨 Starting React Frontend...")
    print("📍 Frontend: http://localhost:5173")
    print("=" * 50)
    
    try:
        # Change to client directory and start the dev server
        os.chdir(client_dir)
        
        # Check if node_modules exists, if not run npm install
        if not (client_dir / "node_modules").exists():
            print("📦 Installing dependencies...")
            subprocess.run(["npm", "install"], check=True)
        
        print("🚀 Starting development server...")
        subprocess.run(["npm", "run", "dev"], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting frontend: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm first.")

if __name__ == "__main__":
    start_frontend() 