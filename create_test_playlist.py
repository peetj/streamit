#!/usr/bin/env python3
"""
Create a test playlist with the existing test songs.
This script will create a playlist and add the test songs to it.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.song import Song
from app.models.playlist import Playlist, PlaylistSong
from sqlalchemy.orm import sessionmaker

def create_test_playlist():
    """Create a test playlist with the existing test songs."""
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Get the test user
        test_user = db.query(User).filter(User.email == "test@streamflow.com").first()
        if not test_user:
            print("❌ Test user not found. Please run the test data setup first.")
            return False
        
        print(f"✅ Found test user: {test_user.email}")
        
        # Get all test songs
        test_songs = db.query(Song).filter(
            Song.uploaded_by == test_user.id
        ).all()
        
        if not test_songs:
            print("❌ No test songs found. Please run add_test_songs.py first.")
            return False
        
        print(f"✅ Found {len(test_songs)} test songs:")
        for song in test_songs:
            print(f"   - {song.title} by {song.artist} ({song.duration}s)")
        
        # Check if test playlist already exists
        existing_playlist = db.query(Playlist).filter(
            Playlist.name == "Test Playlist",
            Playlist.owner_id == test_user.id
        ).first()
        
        if existing_playlist:
            print(f"✅ Test playlist already exists: {existing_playlist.name}")
            print("   Songs in playlist:")
            for playlist_song in existing_playlist.playlist_songs:
                song = playlist_song.song
                print(f"   - {song.title} by {song.artist}")
            return True
        
        # Create new test playlist
        test_playlist = Playlist(
            name="Test Playlist",
            description="A test playlist with sample songs for testing playback functionality",
            owner_id=test_user.id
        )
        
        db.add(test_playlist)
        db.flush()  # Get the ID
        
        print(f"✅ Created test playlist: {test_playlist.name}")
        
        # Add songs to playlist
        for i, song in enumerate(test_songs):
            playlist_song = PlaylistSong(
                playlist_id=test_playlist.id,
                song_id=song.id,
                position=i + 1
            )
            db.add(playlist_song)
            print(f"   Added: {song.title} (position {i + 1})")
        
        # Commit changes
        db.commit()
        
        print(f"✅ Successfully created playlist with {len(test_songs)} songs!")
        print(f"   Playlist ID: {test_playlist.id}")
        print(f"   Playlist Name: {test_playlist.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test playlist: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Main function to create test playlist."""
    print("🎵 Creating Test Playlist...")
    print("=" * 50)
    
    success = create_test_playlist()
    
    if success:
        print("\n✅ Test playlist created successfully!")
        print("\nNext steps:")
        print("1. Start the backend: python run.py")
        print("2. Start the frontend: cd client && npm run dev")
        print("3. Log in with test@streamflow.com / testpass123")
        print("4. Go to Library and test the playlist playback")
    else:
        print("\n❌ Failed to create test playlist.")
        print("Make sure you have:")
        print("1. Run add_test_songs.py to create test songs")
        print("2. The backend is properly configured")

if __name__ == "__main__":
    main() 