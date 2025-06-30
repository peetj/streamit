#!/usr/bin/env python3
"""
Test script to check if a specific song exists in the production database.
"""

import os
import sys
import requests
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_production_song():
    """Test if a specific song exists in production"""
    print("🔍 TESTING PRODUCTION SONG")
    print("=" * 40)
    
    # Get the backend URL from environment or use default
    backend_url = os.getenv('VITE_BACKEND_URL', 'https://web-production-4aaff.up.railway.app')
    print(f"🔍 Backend URL: {backend_url}")
    
    # The song ID that's failing
    song_id = "399b76d3-9dd0-438c-9e04-1b62bd120b8d"
    print(f"🔍 Testing song ID: {song_id}")
    
    # Test the songs endpoint to get the song details
    songs_url = f"{backend_url}/api/songs/{song_id}/"
    print(f"🔍 Testing songs endpoint: {songs_url}")
    
    try:
        # First, let's test without authentication
        print("\n🔍 Testing without authentication...")
        response = requests.get(songs_url)
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            song_data = response.json()
            print(f"✅ Song found!")
            print(f"   Title: {song_data.get('title')}")
            print(f"   Artist: {song_data.get('artist')}")
            print(f"   Album: {song_data.get('album')}")
            print(f"   File path: {song_data.get('file_path')}")
            print(f"   Uploaded by: {song_data.get('uploaded_by')}")
        elif response.status_code == 401:
            print("✅ Expected 401 - authentication required")
        elif response.status_code == 404:
            print("❌ Song not found in database")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response content: {response.text[:500]}...")
        
        # Now test with a fake token
        print("\n🔍 Testing with fake authentication...")
        headers = {'Authorization': 'Bearer fake_token_123'}
        response = requests.get(songs_url, headers=headers)
        print(f"🔍 Response status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Expected 401 - invalid token")
        elif response.status_code == 404:
            print("❌ Song not found (even with auth)")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing song: {e}")

if __name__ == "__main__":
    test_production_song() 