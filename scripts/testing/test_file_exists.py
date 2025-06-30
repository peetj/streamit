#!/usr/bin/env python3
"""
Test script to check if a specific file exists on the production filesystem.
"""

import os
import sys
import requests
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_file_exists():
    """Test if a specific file exists on the production filesystem"""
    print("🔍 TESTING FILE EXISTENCE")
    print("=" * 40)
    
    # Get the backend URL from environment or use default
    backend_url = os.getenv('VITE_BACKEND_URL', 'https://web-production-4aaff.up.railway.app')
    print(f"🔍 Backend URL: {backend_url}")
    
    # The song ID that's failing
    song_id = "399b76d3-9dd0-438c-9e04-1b62bd120b8d"
    print(f"🔍 Testing song ID: {song_id}")
    
    # First, let's get the song details to find the file path
    songs_url = f"{backend_url}/api/songs/{song_id}/"
    print(f"🔍 Getting song details from: {songs_url}")
    
    # You'll need to provide a valid token for this to work
    token = input("Enter a valid token from browser localStorage (or press Enter to skip): ").strip()
    
    if not token:
        print("❌ No token provided, cannot test file existence")
        return
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(songs_url, headers=headers)
        print(f"🔍 Response status: {response.status_code}")
        
        if response.status_code == 200:
            song_data = response.json()
            print(f"✅ Song found!")
            print(f"   Title: {song_data.get('title')}")
            print(f"   Artist: {song_data.get('artist')}")
            print(f"   File path: {song_data.get('file_path')}")
            print(f"   Uploaded by: {song_data.get('uploaded_by')}")
            
            # Now test if the file exists by trying to access it
            file_path = song_data.get('file_path')
            if file_path:
                print(f"\n🔍 Testing file existence...")
                print(f"🔍 File path: {file_path}")
                
                # Try to access the file through the uploads endpoint
                if file_path.startswith('./'):
                    file_path = file_path[2:]  # Remove './' prefix
                elif not file_path.startswith('uploads'):
                    file_path = f"uploads/{file_path}"
                
                file_url = f"{backend_url}/{file_path}"
                print(f"🔍 Testing file URL: {file_url}")
                
                file_response = requests.get(file_url)
                print(f"🔍 File response status: {file_response.status_code}")
                print(f"🔍 File response headers: {dict(file_response.headers)}")
                
                if file_response.status_code == 200:
                    print(f"✅ File exists and is accessible!")
                    print(f"   File size: {len(file_response.content)} bytes")
                    print(f"   Content-Type: {file_response.headers.get('content-type')}")
                elif file_response.status_code == 404:
                    print(f"❌ File not found at path: {file_path}")
                else:
                    print(f"❌ File access failed with status: {file_response.status_code}")
            else:
                print(f"❌ No file path in song data")
        else:
            print(f"❌ Failed to get song data: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing file: {e}")

if __name__ == "__main__":
    test_file_exists() 