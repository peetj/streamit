#!/usr/bin/env python3
"""
Script to create dummy playlists for testing the frontend playlist detail view.
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_USER_EMAIL = "test@streamflow.com"
TEST_USER_PASSWORD = "testpass123"

def login():
    """Login and get access token"""
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.text}")
        return None

def create_playlist(token, name, description):
    """Create a playlist"""
    headers = {"Authorization": f"Bearer {token}"}
    playlist_data = {
        "name": name,
        "description": description
    }
    
    response = requests.post(f"{BASE_URL}/playlists/", json=playlist_data, headers=headers)
    if response.status_code in [200, 201]:
        return response.json()
    else:
        print(f"Failed to create playlist '{name}': {response.text}")
        return None

def get_songs(token):
    """Get all available songs"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/songs/", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get songs: {response.text}")
        return []

def add_song_to_playlist(token, playlist_id, song_id):
    """Add a song to a playlist"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {"song_id": song_id}
    
    response = requests.post(f"{BASE_URL}/playlists/{playlist_id}/songs", json=data, headers=headers)
    return response.status_code in [200, 201]

def main():
    print("🎵 Creating dummy playlists for testing...")
    
    # Login
    token = login()
    if not token:
        print("❌ Failed to login")
        return
    
    print("✅ Logged in successfully")
    
    # Get existing songs
    songs = get_songs(token)
    if not songs:
        print("❌ No songs found. Please upload some songs first.")
        return
    
    print(f"✅ Found {len(songs)} songs")
    
    # Dummy playlist data
    dummy_playlists = [
        {
            "name": "Chill Vibes",
            "description": "Perfect for relaxing and unwinding after a long day"
        },
        {
            "name": "Workout Mix",
            "description": "High energy tracks to keep you motivated during exercise"
        },
        {
            "name": "Road Trip",
            "description": "The perfect soundtrack for your next adventure"
        },
        {
            "name": "Late Night Coding",
            "description": "Ambient and electronic music for focused programming sessions"
        },
        {
            "name": "Weekend Party",
            "description": "Upbeat tracks to get the party started"
        },
        {
            "name": "Study Session",
            "description": "Instrumental music to help you concentrate"
        },
        {
            "name": "Morning Motivation",
            "description": "Energetic songs to start your day right"
        },
        {
            "name": "Rainy Day",
            "description": "Mellow tunes perfect for cozy indoor days"
        }
    ]
    
    created_playlists = []
    
    # Create playlists
    for playlist_data in dummy_playlists:
        playlist = create_playlist(token, playlist_data["name"], playlist_data["description"])
        if playlist:
            created_playlists.append(playlist)
            print(f"✅ Created playlist: {playlist_data['name']} (ID: {playlist['id']})")
        else:
            print(f"❌ Failed to create playlist: {playlist_data['name']}")
    
    # Add random songs to each playlist
    for playlist in created_playlists:
        # Add 3-8 random songs to each playlist
        num_songs = random.randint(3, min(8, len(songs)))
        selected_songs = random.sample(songs, num_songs)
        
        print(f"\n📝 Adding songs to '{playlist['name']}':")
        for song in selected_songs:
            if add_song_to_playlist(token, playlist["id"], song["id"]):
                print(f"  ✅ Added '{song['title']}' to '{playlist['name']}'")
            else:
                print(f"  ❌ Failed to add '{song['title']}' to '{playlist['name']}'")
    
    print(f"\n🎉 Successfully created {len(created_playlists)} dummy playlists!")
    print("You can now test the playlist detail view in the frontend.")

if __name__ == "__main__":
    main() 