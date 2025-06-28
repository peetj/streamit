#!/usr/bin/env python3
"""
Admin Tools Server for StreamFlow
Serves various admin and testing pages for the StreamFlow application.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Add the scripts directory to the Python path to import utils
scripts_dir = Path(__file__).parent.parent
sys.path.insert(0, str(scripts_dir))

from utils import find_project_root

# Add the project root to the Python path
project_root = find_project_root()
sys.path.insert(0, str(project_root))

def main():
    # Change to the admin directory
    admin_dir = project_root / "admin"
    os.chdir(admin_dir)
    
    PORT = 8081
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Add CORS headers for cross-origin requests
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            super().end_headers()
        
        def do_OPTIONS(self):
            self.send_response(200)
            self.end_headers()
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Admin server starting on http://localhost:{PORT}")
        print(f"📁 Serving files from: {admin_dir}")
        print("\n📋 Available admin tools:")
        print(f"   • Dashboard: http://localhost:{PORT}/index.html")
        print(f"   • Backend Test: http://localhost:{PORT}/test_backend.html")
        print(f"   • Auth Test: http://localhost:{PORT}/test_auth.html")
        print(f"   • Playlist Test: http://localhost:{PORT}/playlist_test.html")
        print(f"   • Song Integration Test: http://localhost:{PORT}/test_song_integration.html")
        print(f"   • Playlist Playback Test: http://localhost:{PORT}/test_playlist_playback.html")
        print(f"   • Debug Playlist: http://localhost:{PORT}/debug_playlist.html")
        print(f"   • Playlist Cover Test: http://localhost:{PORT}/test_playlist_cover.html")
        print("\n💡 Tip: Make sure the backend server is running on port 8000")
        print("   Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Admin server stopped")

if __name__ == "__main__":
    main() 