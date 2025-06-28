#!/usr/bin/env python3
"""
Add the newly created test audio files to the database with proper metadata.
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.database import SessionLocal, engine
from app.models.song import Song
from app.services.metadata_service import MetadataService
from sqlalchemy.orm import sessionmaker
import uuid

def add_test_songs():
    """Add the newly created test audio files to the database"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Test user ID (from the existing test user)
        user_id = "5df8c64f-a0df-4089-8fd1-d813cd021b31"
        
        # Test audio files directory
        audio_dir = Path("uploads/audio") / user_id
        
        # Look for test_song_*.mp3 files
        test_files = list(audio_dir.glob("test_song_*.mp3"))
        
        print(f"Found {len(test_files)} test audio files")
        
        for file_path in test_files:
            print(f"\nProcessing: {file_path.name}")
            
            # Check if song already exists in database
            existing_song = db.query(Song).filter(Song.file_path == str(file_path)).first()
            if existing_song:
                print(f"  ⚠️  Song already exists in database, skipping")
                continue
            
            # Extract metadata
            try:
                metadata = MetadataService.extract_metadata(str(file_path))
                print(f"  🎵 Extracted metadata:")
                print(f"     Duration: {metadata.get('duration', 0)} seconds")
                print(f"     Bitrate: {metadata.get('bitrate', 0)}")
                print(f"     Sample rate: {metadata.get('sample_rate', 0)}")
                print(f"     Title: {metadata.get('title', '')}")
                print(f"     Artist: {metadata.get('artist', '')}")
                print(f"     Album: {metadata.get('album', '')}")
                
                # Create song record
                song_data = {
                    "id": str(uuid.uuid4()),
                    "title": metadata.get("title") or file_path.stem,
                    "artist": metadata.get("artist") or "Test Artist",
                    "album": metadata.get("album") or "Test Album",
                    "genre": metadata.get("genre", ""),
                    "year": metadata.get("year"),
                    "duration": metadata.get("duration", 0),
                    "file_path": str(file_path),
                    "file_size": file_path.stat().st_size,
                    "format": file_path.suffix[1:].lower(),
                    "bitrate": metadata.get("bitrate", 0),
                    "sample_rate": metadata.get("sample_rate", 0),
                    "uploaded_by": user_id
                }
                
                # Extract album art if available
                artwork_dir = Path("uploads/artwork") / user_id
                album_art_path = MetadataService.extract_album_art(str(file_path), str(artwork_dir))
                if album_art_path:
                    song_data["album_art_path"] = album_art_path
                
                # Create song record
                db_song = Song(**song_data)
                db.add(db_song)
                
                print(f"  ✅ Added song to database: {song_data['title']}")
                
            except Exception as e:
                print(f"  ❌ Error processing {file_path.name}: {e}")
        
        # Commit changes
        db.commit()
        print(f"\n✅ Successfully added test songs to database")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🎵 Adding test songs to database...")
    add_test_songs()
    print("\n🎉 Done! You can now test playlist playback with the new songs.") 