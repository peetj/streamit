#!/usr/bin/env python3
"""
Upload songs for the test user using the new backend endpoints.
This script helps you upload songs that will be owned by the test user.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
import requests
import json

def get_test_user_id():
    """Get the test user's ID from the database."""
    db = SessionLocal()
    try:
        test_user = db.query(User).filter(User.email == "test@streamflow.com").first()
        if not test_user:
            print("❌ Test user not found. Please create the test user first.")
            return None
        return test_user.id
    finally:
        db.close()

def upload_song_for_test_user(file_path, title=None, artist=None, album=None, genre=None, year=None):
    """Upload a song for the test user using the backend API."""
    
    # Get test user ID
    user_id = get_test_user_id()
    if not user_id:
        return False
    
    print(f"📤 Uploading song for test user: {user_id}")
    
    # Prepare the upload
    url = f"http://localhost:8000/api/songs/upload-for-user/{user_id}"
    
    # Prepare form data
    files = {'file': open(file_path, 'rb')}
    data = {}
    
    if title:
        data['title'] = title
    if artist:
        data['artist'] = artist
    if album:
        data['album'] = album
    if genre:
        data['genre'] = genre
    if year:
        data['year'] = year
    
    try:
        # Note: You'll need to get an admin token first
        # For now, this will show you the curl command to run
        print(f"\n🔧 To upload this song, run this curl command:")
        print(f"curl -X POST '{url}' \\")
        print(f"  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \\")
        print(f"  -F 'file=@{file_path}' \\")
        
        for key, value in data.items():
            print(f"  -F '{key}={value}' \\")
        
        print(f"\n📝 Or use the FastAPI docs at: http://localhost:8000/docs")
        print(f"   Endpoint: POST /api/songs/upload-for-user/{user_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error preparing upload: {e}")
        return False

def main():
    """Main function to help with song uploads."""
    print("🎵 Upload Songs for Test User")
    print("=" * 50)
    
    # Get test user info
    user_id = get_test_user_id()
    if not user_id:
        return
    
    print(f"✅ Test user ID: {user_id}")
    print(f"✅ Test user email: test@streamflow.com")
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend is not responding properly")
            return
    except:
        print("❌ Backend is not running. Please start it with: python run.py")
        return
    
    print("\n📋 To upload songs for the test user:")
    print("1. Start the backend: python run.py")
    print("2. Get an admin token from: http://localhost:8000/docs")
    print("3. Use the endpoint: POST /api/songs/upload-for-user/{user_id}")
    print(f"4. Or use the modified endpoint: POST /api/songs/upload with user_id={user_id}")
    
    print(f"\n🔗 Direct links:")
    print(f"   - FastAPI docs: http://localhost:8000/docs")
    print(f"   - Upload for user endpoint: http://localhost:8000/docs#/Songs/upload_song_for_user")
    print(f"   - Modified upload endpoint: http://localhost:8000/docs#/Songs/upload_song")

if __name__ == "__main__":
    main() 