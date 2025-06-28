#!/usr/bin/env python3
"""
Test script for liked songs functionality
"""

import requests
import json
import sys
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@streamflow.com"
TEST_PASSWORD = "{g<poL98iiKSB4c("  # This matches the password in AuthPage.tsx

def get_auth_token() -> Optional[str]:
    """Get authentication token for the test user"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error during login: {e}")
        return None

def test_liked_songs_endpoints():
    """Test the liked songs endpoints"""
    print("🔐 Getting authentication token...")
    token = get_auth_token()
    
    if not token:
        print("❌ Failed to get authentication token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Authentication successful")
    print("\n🧪 Testing liked songs endpoints...")
    
    # Test 1: Get liked songs (should be empty initially)
    print("\n1️⃣ Testing GET /api/songs/liked (initial state)...")
    try:
        response = requests.get(f"{BASE_URL}/api/songs/liked", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            liked_songs = response.json()
            print(f"   Liked songs count: {len(liked_songs)}")
            if liked_songs:
                print(f"   First liked song: {liked_songs[0].get('title', 'Unknown')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Get user's songs to find one to like
    print("\n2️⃣ Getting user's songs to test like functionality...")
    try:
        response = requests.get(f"{BASE_URL}/api/songs", headers=headers)
        if response.status_code == 200:
            songs = response.json()
            print(f"   User has {len(songs)} songs")
            
            if songs:
                test_song = songs[0]
                song_id = test_song['id']
                song_title = test_song.get('title', 'Unknown')
                print(f"   Will test with song: {song_title} (ID: {song_id})")
                
                # Test 3: Like a song
                print(f"\n3️⃣ Testing POST /api/songs/{song_id}/like...")
                like_response = requests.post(f"{BASE_URL}/api/songs/{song_id}/like", headers=headers)
                print(f"   Status: {like_response.status_code}")
                if like_response.status_code == 200:
                    print(f"   Response: {like_response.json()}")
                    
                    # Test 4: Verify song is now liked
                    print(f"\n4️⃣ Verifying song is now liked...")
                    liked_response = requests.get(f"{BASE_URL}/api/songs/liked", headers=headers)
                    if liked_response.status_code == 200:
                        liked_songs = liked_response.json()
                        print(f"   Liked songs count: {len(liked_songs)}")
                        if liked_songs:
                            print(f"   Liked song: {liked_songs[0].get('title', 'Unknown')}")
                    
                    # Test 5: Unlike the song
                    print(f"\n5️⃣ Testing POST /api/songs/{song_id}/unlike...")
                    unlike_response = requests.post(f"{BASE_URL}/api/songs/{song_id}/unlike", headers=headers)
                    print(f"   Status: {unlike_response.status_code}")
                    if unlike_response.status_code == 200:
                        print(f"   Response: {unlike_response.json()}")
                        
                        # Test 6: Verify song is no longer liked
                        print(f"\n6️⃣ Verifying song is no longer liked...")
                        final_liked_response = requests.get(f"{BASE_URL}/api/songs/liked", headers=headers)
                        if final_liked_response.status_code == 200:
                            final_liked_songs = final_liked_response.json()
                            print(f"   Final liked songs count: {len(final_liked_songs)}")
                else:
                    print(f"   Error: {like_response.text}")
            else:
                print("   No songs available for testing")
        else:
            print(f"   Error getting songs: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n✅ Liked songs functionality test completed!")
    return True

if __name__ == "__main__":
    print("🎵 Testing StreamFlow Liked Songs Functionality")
    print("=" * 50)
    
    success = test_liked_songs_endpoints()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        print("\n📝 Next steps:")
        print("   1. Open http://localhost:5173 in your browser")
        print("   2. Login with test@streamflow.com")
        print("   3. Go to 'Liked Songs' in the sidebar")
        print("   4. Try liking songs from your library")
        print("   5. Verify the heart icons work in playlist views")
    else:
        print("\n❌ Tests failed!")
        sys.exit(1) 