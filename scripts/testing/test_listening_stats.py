#!/usr/bin/env python3
"""
Test script for listening session tracking and playlist statistics.
This script will:
1. Create a test user and playlist
2. Add some songs to the playlist
3. Simulate listening sessions
4. Check the listening statistics
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "test",
    "email": "test@streamflow.com",
    "password": "testpass123"
}

def make_request(method: str, endpoint: str, data: Dict[str, Any] = None, token: str = None) -> Dict[str, Any]:
    """Make an authenticated request to the API."""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if method.upper() == "GET":
        response = requests.get(url, headers=headers)
    elif method.upper() == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method.upper() == "PUT":
        response = requests.put(url, headers=headers, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    if response.status_code >= 400:
        print(f"Error {response.status_code}: {response.text}")
        return None
    
    return response.json()

def login_user() -> str:
    """Login and return the access token."""
    print("Logging in test user...")
    response = make_request("POST", "/api/auth/login", TEST_USER)
    if response:
        return response["access_token"]
    return None

def create_test_playlist(token: str) -> str:
    """Create a test playlist and return its ID."""
    print("Creating test playlist...")
    playlist_data = {
        "name": "Test Listening Playlist",
        "description": "A playlist for testing listening statistics"
    }
    response = make_request("POST", "/api/playlists/", playlist_data, token)
    if response:
        return response["id"]
    return None

def get_user_songs(token: str) -> list:
    """Get songs owned by the test user."""
    print("Getting user songs...")
    response = make_request("GET", "/api/songs/", token=token)
    if response:
        return response
    return []

def add_song_to_playlist(playlist_id: str, song_id: str, token: str) -> bool:
    """Add a song to the playlist."""
    song_data = {"song_id": song_id}
    response = make_request("POST", f"/api/playlists/{playlist_id}/songs", song_data, token)
    return response is not None

def start_listening_session(song_id: str, playlist_id: str, token: str) -> str:
    """Start a listening session and return the session ID."""
    params = f"?playlist_id={playlist_id}" if playlist_id else ""
    response = make_request("POST", f"/api/songs/{song_id}/listen{params}", token=token)
    if response:
        return response["session_id"]
    return None

def complete_listening_session(song_id: str, session_id: str, duration_seconds: float, token: str) -> bool:
    """Complete a listening session."""
    data = {"duration_seconds": duration_seconds}
    response = make_request("PUT", f"/api/songs/{song_id}/listen/{session_id}", data, token)
    return response is not None

def get_playlist_stats(playlist_id: str, token: str) -> Dict[str, Any]:
    """Get listening statistics for a playlist."""
    response = make_request("GET", f"/api/playlists/{playlist_id}/listening-stats", token=token)
    return response

def main():
    print("=== Testing Listening Session Tracking ===\n")
    
    # Step 1: Login
    token = login_user()
    if not token:
        print("Failed to login. Make sure the backend is running and the test user exists.")
        return
    
    print("✓ Login successful\n")
    
    # Step 2: Create playlist
    playlist_id = create_test_playlist(token)
    if not playlist_id:
        print("Failed to create playlist.")
        return
    
    print(f"✓ Playlist created with ID: {playlist_id}\n")
    
    # Step 3: Get user songs
    songs = get_user_songs(token)
    if not songs:
        print("No songs found. Please upload some songs first.")
        return
    
    print(f"✓ Found {len(songs)} songs\n")
    
    # Step 4: Add songs to playlist
    print("Adding songs to playlist...")
    added_songs = []
    for i, song in enumerate(songs[:3]):  # Add first 3 songs
        if add_song_to_playlist(playlist_id, song["id"], token):
            added_songs.append(song)
            print(f"✓ Added: {song['title']} by {song['artist']}")
    
    if not added_songs:
        print("Failed to add songs to playlist.")
        return
    
    print(f"\n✓ Added {len(added_songs)} songs to playlist\n")
    
    # Step 5: Simulate listening sessions
    print("Simulating listening sessions...")
    for song in added_songs:
        print(f"\nListening to: {song['title']}")
        
        # Start session
        session_id = start_listening_session(song["id"], playlist_id, token)
        if not session_id:
            print("  ✗ Failed to start listening session")
            continue
        
        print(f"  ✓ Started session: {session_id}")
        
        # Simulate listening for 30-60 seconds
        listen_duration = 30 + (hash(song["id"]) % 30)  # Random duration between 30-60 seconds
        time.sleep(2)  # Simulate actual listening time
        
        # Complete session
        if complete_listening_session(song["id"], session_id, listen_duration, token):
            print(f"  ✓ Completed session: {listen_duration:.1f} seconds")
        else:
            print("  ✗ Failed to complete listening session")
    
    print("\n✓ Listening sessions completed\n")
    
    # Step 6: Check playlist statistics
    print("Checking playlist listening statistics...")
    stats = get_playlist_stats(playlist_id, token)
    
    if stats:
        print("\n=== Playlist Listening Statistics ===")
        print(f"Total listening time: {stats['total_listening_minutes']:.1f} minutes")
        print(f"Total listening time: {stats['total_listening_seconds']:.1f} seconds")
        print(f"Number of songs with stats: {len(stats['song_stats'])}")
        
        print("\nIndividual song statistics:")
        for song_stat in stats['song_stats']:
            print(f"  • {song_stat['title']} by {song_stat['artist']}")
            print(f"    - Play count: {song_stat['play_count']}")
            print(f"    - Listening time: {song_stat['listening_minutes']:.1f} minutes")
        
        print("\n✓ Listening statistics retrieved successfully!")
    else:
        print("✗ Failed to get playlist statistics")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main() 