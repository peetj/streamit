#!/usr/bin/env python3
"""
Create a test playlist for the test user to demonstrate playlists from different users.
"""

import requests
import json

# Configuration
API_BASE = "http://localhost:8000/api"
TEST_EMAIL = "test@streamflow.com"
TEST_PASSWORD = "testpass123"

def get_auth_token():
    """Get test user authentication token."""
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        return None

def create_test_user_playlist(token):
    """Create a test playlist for the test user."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    playlist_data = {
        "name": "Test User's Favorites",
        "description": "A playlist created by the test user"
    }
    
    response = requests.post(f"{API_BASE}/playlists/", json=playlist_data, headers=headers)
    if response.status_code == 200:
        playlist = response.json()
        print(f"✅ Created playlist: {playlist['name']} (ID: {playlist['id']})")
        return playlist
    else:
        print(f"❌ Failed to create playlist: {response.status_code}")
        return None

def main():
    print("🎵 Creating test playlist for test user...")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Could not authenticate. Make sure the backend is running and test user credentials are correct.")
        return
    
    # Create playlist
    playlist = create_test_user_playlist(token)
    if playlist:
        print(f"\n📋 Playlist created successfully!")
        print(f"   Name: {playlist['name']}")
        print(f"   ID: {playlist['id']}")
        print(f"   Description: {playlist['description']}")
        print(f"\n🎯 This playlist will now appear in the admin dashboard with the test user as owner.")
    else:
        print("❌ Failed to create playlist.")

if __name__ == "__main__":
    main() 