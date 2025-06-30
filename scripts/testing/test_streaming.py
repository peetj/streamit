#!/usr/bin/env python3
"""
Test script to directly test the streaming endpoint.
"""

import os
import sys
import requests
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_streaming():
    """Test the streaming endpoint directly"""
    print("🔍 TESTING STREAMING ENDPOINT")
    print("=" * 40)
    
    # Get the backend URL from environment or use default
    backend_url = os.getenv('VITE_BACKEND_URL', 'https://web-production-4aaff.up.railway.app')
    print(f"🔍 Backend URL: {backend_url}")
    
    # Test with a known song ID from the database
    song_id = "31215a84-b540-4ff2-b0da-028eebb621fd"  # "Take me to the Pilot" by Elton John
    stream_url = f"{backend_url}/api/stream/song/{song_id}/"
    print(f"🔍 Testing streaming URL: {stream_url}")
    
    try:
        # First, let's test without authentication to see what happens
        print("\n🔍 Testing without authentication...")
        response = requests.get(stream_url)
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("✅ Expected 401 - authentication required")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response content: {response.text[:500]}...")
        
        # Now test with a fake token to see what happens
        print("\n🔍 Testing with fake authentication...")
        headers = {'Authorization': 'Bearer fake_token_123'}
        response = requests.get(stream_url, headers=headers)
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("✅ Expected 401 - invalid token")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response content: {response.text[:500]}...")
            
    except Exception as e:
        print(f"❌ Error testing streaming: {e}")

if __name__ == "__main__":
    test_streaming() 