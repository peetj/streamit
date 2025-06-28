#!/usr/bin/env python3
"""
Script to create test data for cleanup functionality demonstration.
This will add duplicate songs and orphaned files to test the cleanup feature.
"""

import os
import shutil
import uuid
from pathlib import Path
from app.database import SessionLocal
from app.models.song import Song
from app.models.user import User
import datetime

def create_test_cleanup_data():
    """Create duplicate songs and orphaned files for testing cleanup."""
    db = SessionLocal()
    
    try:
        # Get admin user
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            print("❌ Admin user not found. Please run the admin creation script first.")
            return
        
        print(f"👤 Using admin user: {admin_user.username}")
        
        # Create duplicate songs
        print("\n🗑️ Creating duplicate songs...")
        
        # Get existing songs to duplicate
        existing_songs = db.query(Song).limit(2).all()
        
        for i, original_song in enumerate(existing_songs):
            # Create 2 duplicates of each song
            for dup_num in range(1, 3):
                duplicate_song = Song(
                    id=str(uuid.uuid4()),
                    title=original_song.title,
                    artist=original_song.artist,
                    album=original_song.album,
                    genre=original_song.genre,
                    year=original_song.year,
                    duration=original_song.duration,
                    file_path=f"uploads/audio/{admin_user.id}/duplicate_{i}_{dup_num}.mp3",
                    file_size=original_song.file_size,
                    format=original_song.format,
                    bitrate=original_song.bitrate,
                    sample_rate=original_song.sample_rate,
                    album_art_path=original_song.album_art_path,
                    uploaded_by=admin_user.id,
                    created_at=datetime.datetime.utcnow() + datetime.timedelta(hours=dup_num)  # Make duplicates newer
                )
                db.add(duplicate_song)
                print(f"  - Created duplicate: {duplicate_song.title} by {duplicate_song.artist}")
        
        # Create orphaned audio files
        print("\n🎵 Creating orphaned audio files...")
        audio_dir = Path("uploads/audio") / admin_user.id
        audio_dir.mkdir(parents=True, exist_ok=True)
        
        for i in range(3):
            orphaned_file = audio_dir / f"orphaned_audio_{i}.mp3"
            orphaned_file.write_text(f"This is orphaned audio file {i}")
            print(f"  - Created orphaned audio: {orphaned_file}")
        
        # Create orphaned artwork files
        print("\n🎨 Creating orphaned artwork files...")
        artwork_dir = Path("uploads/artwork") / admin_user.id
        artwork_dir.mkdir(parents=True, exist_ok=True)
        
        for i in range(2):
            orphaned_artwork = artwork_dir / f"orphaned_artwork_{i}.jpg"
            orphaned_artwork.write_text(f"This is orphaned artwork file {i}")
            print(f"  - Created orphaned artwork: {orphaned_artwork}")
        
        # Commit all changes
        db.commit()
        
        # Show summary
        total_songs = db.query(Song).count()
        print(f"\n✅ Test data created successfully!")
        print(f"📊 Summary:")
        print(f"  - Total songs in database: {total_songs}")
        print(f"  - Duplicate songs added: {len(existing_songs) * 2}")
        print(f"  - Orphaned audio files: 3")
        print(f"  - Orphaned artwork files: 2")
        print(f"\n🧹 Now you can test the cleanup feature:")
        print(f"  1. Go to http://localhost:8080/admin.html")
        print(f"  2. Login with admin credentials")
        print(f"  3. Click '🔍 Dry Run (Preview)' to see what would be cleaned")
        print(f"  4. Click '🧹 Full Cleanup' to actually perform the cleanup")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_cleanup_data() 