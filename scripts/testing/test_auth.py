#!/usr/bin/env python3
"""
Test script to check user authentication and see what user is logged in.
"""

import os
import sys
import requests
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_auth():
    """Test authentication with the backend"""
    print("🔍 TESTING AUTHENTICATION")
    print("=" * 40)
    
    # Get the backend URL from environment or use default
    backend_url = os.getenv('VITE_BACKEND_URL', 'https://web-production-4aaff.up.railway.app')
    print(f"🔍 Backend URL: {backend_url}")
    
    # Test the /api/auth/me endpoint
    me_url = f"{backend_url}/api/auth/me/"
    print(f"🔍 Testing endpoint: {me_url}")
    
    try:
        response = requests.get(me_url)
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Authentication successful!")
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Username: {user_data.get('username')}")
            print(f"   Email: {user_data.get('email')}")
            print(f"   Role: {user_data.get('role')}")
        else:
            print(f"❌ Authentication failed")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing authentication: {e}")

if __name__ == "__main__":
    test_auth() 