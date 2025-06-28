#!/usr/bin/env python3
"""
Fix song metadata in the database by re-extracting duration and other information
from the actual audio files.
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

def fix_song_metadata():
    """Fix metadata for all songs in the database"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get all songs
        songs = db.query(Song).all()
        print(f"Found {len(songs)} songs to process")
        
        for song in songs:
            print(f"\nProcessing: {song.title}")
            
            # Check if file exists
            if not os.path.exists(song.file_path):
                print(f"  ❌ File not found: {song.file_path}")
                continue
            
            # Get file size
            file_size = os.path.getsize(song.file_path)
            print(f"  📁 File size: {file_size} bytes")
            
            # Skip very small files (likely corrupted)
            if file_size < 1000:
                print(f"  ⚠️  File too small, skipping: {file_size} bytes")
                continue
            
            # Extract metadata
            try:
                metadata = MetadataService.extract_metadata(song.file_path)
                print(f"  🎵 Extracted metadata:")
                print(f"     Duration: {metadata.get('duration', 0)} seconds")
                print(f"     Bitrate: {metadata.get('bitrate', 0)}")
                print(f"     Sample rate: {metadata.get('sample_rate', 0)}")
                print(f"     Title: {metadata.get('title', '')}")
                print(f"     Artist: {metadata.get('artist', '')}")
                print(f"     Album: {metadata.get('album', '')}")
                
                # Update song with new metadata
                if metadata.get('duration', 0) > 0:
                    song.duration = metadata.get('duration', 0)
                    song.bitrate = metadata.get('bitrate', 0)
                    song.sample_rate = metadata.get('sample_rate', 0)
                    
                    # Only update title/artist/album if they're not already set
                    if not song.title or song.title == 'Unknown Title':
                        song.title = metadata.get('title', song.title)
                    if not song.artist or song.artist == 'Unknown Artist':
                        song.artist = metadata.get('artist', song.artist)
                    if not song.album or song.album == 'Unknown Album':
                        song.album = metadata.get('album', song.album)
                    
                    print(f"  ✅ Updated song metadata")
                else:
                    print(f"  ⚠️  No duration found, skipping update")
                    
            except Exception as e:
                print(f"  ❌ Error extracting metadata: {e}")
        
        # Commit changes
        db.commit()
        print(f"\n✅ Successfully updated metadata for songs")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

def create_test_audio_files():
    """Create some test audio files with proper metadata"""
    import subprocess
    import tempfile
    
    print("\n🎵 Creating test audio files...")
    
    # Create a simple test audio file using ffmpeg
    try:
        # Check if ffmpeg is available
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ ffmpeg not found. Please install ffmpeg to create test audio files.")
            return
    except FileNotFoundError:
        print("❌ ffmpeg not found. Please install ffmpeg to create test audio files.")
        return
    
    # Create test audio files
    test_files = [
        {"name": "test_song_1", "duration": 30, "title": "Test Song 1", "artist": "Test Artist", "album": "Test Album"},
        {"name": "test_song_2", "duration": 45, "title": "Test Song 2", "artist": "Test Artist", "album": "Test Album"},
        {"name": "test_song_3", "duration": 60, "title": "Test Song 3", "artist": "Test Artist", "album": "Test Album"},
    ]
    
    upload_dir = Path("uploads/audio/5df8c64f-a0df-4089-8fd1-d813cd021b31")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    for test_file in test_files:
        output_path = upload_dir / f"{test_file['name']}.mp3"
        
        # Create a simple sine wave audio file
        cmd = [
            'ffmpeg', '-y',  # Overwrite output file
            '-f', 'lavfi',   # Use lavfi input format
            '-i', f'sine=frequency=440:duration={test_file["duration"]}',  # 440Hz sine wave
            '-c:a', 'mp3',   # MP3 codec
            '-b:a', '128k',  # 128kbps bitrate
            '-metadata', f'title={test_file["title"]}',
            '-metadata', f'artist={test_file["artist"]}',
            '-metadata', f'album={test_file["album"]}',
            str(output_path)
        ]
        
        print(f"Creating {test_file['name']}.mp3 ({test_file['duration']}s)...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Created {output_path}")
        else:
            print(f"❌ Failed to create {output_path}: {result.stderr}")

if __name__ == "__main__":
    print("🔧 Fixing song metadata...")
    
    # First, try to fix existing files
    fix_song_metadata()
    
    # Then create new test files
    create_test_audio_files()
    
    print("\n🎉 Done! You can now test playlist playback with proper song durations.") 