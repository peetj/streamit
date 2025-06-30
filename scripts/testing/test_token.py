#!/usr/bin/env python3
"""
Test script to check if a token is valid.
"""

import os
import sys
import requests
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_token():
    """Test if a token is valid"""
    print("🔍 TESTING TOKEN VALIDITY")
    print("=" * 40)
    
    # Get the backend URL from environment or use default
    backend_url = os.getenv('VITE_BACKEND_URL', 'https://web-production-4aaff.up.railway.app')
    print(f"🔍 Backend URL: {backend_url}")
    
    # Test the /api/auth/me endpoint
    me_url = f"{backend_url}/api/auth/me/"
    print(f"🔍 Testing endpoint: {me_url}")
    
    # You can replace this with an actual token from the browser's localStorage
    # To get the token: open browser dev tools -> Application -> Local Storage -> streamflow_token
    token = input("Enter the token from browser localStorage (or press Enter to skip): ").strip()
    
    if not token:
        print("❌ No token provided")
        return
    
    print(f"🔍 Token (first 20 chars): {token[:20]}...")
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(me_url, headers=headers)
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Token is valid!")
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Username: {user_data.get('username')}")
            print(f"   Email: {user_data.get('email')}")
            print(f"   Role: {user_data.get('role')}")
        else:
            print(f"❌ Token is invalid")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing token: {e}")

if __name__ == "__main__":
    test_token() 