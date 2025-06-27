#!/usr/bin/env python3
"""
Start the admin page HTTP server
"""
import http.server
import socketserver
import os
import sys
from pathlib import Path

def start_admin_server():
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    admin_dir = project_root / "admin"
    
    if not admin_dir.exists():
        print("❌ Admin directory not found!")
        print(f"Expected location: {admin_dir}")
        return
    
    # Change to admin directory
    os.chdir(admin_dir)
    
    PORT = 8080
    
    print("🔧 Starting Admin Page Server...")
    print(f"📍 Admin Page: http://localhost:{PORT}/admin.html")
    print(f"📍 Test Backend: http://localhost:{PORT}/test_backend.html")
    print("=" * 50)
    
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f"✅ Admin server running on port {PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Admin server stopped")

if __name__ == "__main__":
    start_admin_server() 