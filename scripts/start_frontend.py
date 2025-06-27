#!/usr/bin/env python3
"""
Start the React frontend development server from the project root.
"""
import subprocess
import sys
from pathlib import Path
import shutil

def start_frontend():
    project_root = Path(__file__).parent.parent
    client_dir = project_root / "client"

    if not client_dir.exists():
        print("❌ Client directory not found!")
        print(f"Expected location: {client_dir}")
        return

    # Check if npm is available
    if not shutil.which("npm"):
        print("❌ npm not found in PATH. Please install Node.js and npm, and ensure they are in your PATH.")
        return

    print("🎨 Starting React Frontend...")
    print("📍 Frontend: http://localhost:5173")
    print("=" * 50)

    try:
        # Install dependencies if needed
        if not (client_dir / "node_modules").exists():
            print("📦 Installing dependencies...")
            subprocess.run(["npm", "install"], cwd=client_dir, check=True, shell=sys.platform.startswith("win"))

        print("🚀 Starting development server...")
        subprocess.run([
            "npm", "run", "dev", "--",
            "--host", "0.0.0.0",
            "--port", "5173",
            "--force"
        ], cwd=client_dir, check=True, shell=sys.platform.startswith("win"))

    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting frontend: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm first.")

if __name__ == "__main__":
    start_frontend() 