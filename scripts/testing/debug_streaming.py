#!/usr/bin/env python3
"""
Debug script to check song data and file paths for streaming issues.
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database import get_db
from app.models.song import Song
from app.models.user import User

def debug_songs():
    """Debug song data and file paths"""
    print("🔍 DEBUGGING SONGS AND FILE PATHS")
    print("=" * 50)
    
    db = next(get_db())
    
    # Get all songs
    songs = db.query(Song).all()
    print(f"📊 Total songs in database: {len(songs)}")
    
    if not songs:
        print("❌ No songs found in database!")
        return
    
    print("\n📋 SONG DETAILS:")
    print("-" * 50)
    
    for i, song in enumerate(songs, 1):
        print(f"\n🎵 Song {i}:")
        print(f"   ID: {song.id}")
        print(f"   Title: {song.title}")
        print(f"   Artist: {song.artist}")
        print(f"   Album: {song.album}")
        print(f"   Duration: {song.duration} seconds")
        print(f"   File path: {song.file_path}")
        print(f"   Uploaded by: {song.uploaded_by}")
        print(f"   Created at: {song.created_at}")
        
        # Check if file exists
        if song.file_path:
            file_exists = os.path.exists(song.file_path)
            print(f"   File exists: {'✅' if file_exists else '❌'}")
            
            if file_exists:
                file_size = os.path.getsize(song.file_path)
                print(f"   File size: {file_size} bytes")
            else:
                print(f"   ❌ File not found at path: {song.file_path}")
        else:
            print(f"   ❌ No file path set")
    
    # Get all users
    users = db.query(User).all()
    print(f"\n👥 USERS IN DATABASE:")
    print("-" * 30)
    for user in users:
        print(f"   {user.username} (ID: {user.id}, Role: {user.role})")
    
    # Check uploads directory structure
    print(f"\n📁 UPLOADS DIRECTORY STRUCTURE:")
    print("-" * 40)
    
    uploads_dir = Path("uploads")
    if uploads_dir.exists():
        print(f"✅ Uploads directory exists: {uploads_dir}")
        
        audio_dir = uploads_dir / "audio"
        if audio_dir.exists():
            print(f"✅ Audio directory exists: {audio_dir}")
            audio_files = list(audio_dir.glob("*"))
            print(f"   Audio files found: {len(audio_files)}")
            for audio_file in audio_files:
                print(f"   - {audio_file.name} ({audio_file.stat().st_size} bytes)")
        else:
            print(f"❌ Audio directory not found: {audio_dir}")
        
        artwork_dir = uploads_dir / "artwork"
        if artwork_dir.exists():
            print(f"✅ Artwork directory exists: {artwork_dir}")
            artwork_files = list(artwork_dir.glob("*"))
            print(f"   Artwork files found: {len(artwork_files)}")
        else:
            print(f"❌ Artwork directory not found: {artwork_dir}")
    else:
        print(f"❌ Uploads directory not found: {uploads_dir}")

if __name__ == "__main__":
    debug_songs() 