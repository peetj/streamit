#!/usr/bin/env python3
"""
Create a test playlist for admin dashboard testing.
"""

import requests
import json

# Configuration
API_BASE = "http://localhost:8000/api"
ADMIN_EMAIL = "admin@streamflow.com"
ADMIN_PASSWORD = "adminpass123"

def get_auth_token():
    """Get admin authentication token."""
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        return None

def create_test_playlist(token):
    """Create a test playlist."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    playlist_data = {
        "name": "Admin Test Playlist",
        "description": "A test playlist created for admin dashboard testing"
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
    print("🎵 Creating test playlist for admin dashboard...")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Could not authenticate. Make sure the backend is running and admin credentials are correct.")
        return
    
    # Create playlist
    playlist = create_test_playlist(token)
    if playlist:
        print(f"\n📋 Playlist created successfully!")
        print(f"   Name: {playlist['name']}")
        print(f"   ID: {playlist['id']}")
        print(f"   Description: {playlist['description']}")
        print(f"\n🎯 You can now use this playlist in the admin dashboard upload section.")
    else:
        print("❌ Failed to create playlist.")

if __name__ == "__main__":
    main() 