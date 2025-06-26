#!/usr/bin/env python3
"""
Download sample MP3 files and set up test data for StreamFlow backend
"""
import os
import requests
import uuid
from pathlib import Path
import sys

# Add the app directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.metadata_service import MetadataService
from tests.conftest import test_data_manager, get_test_user_credentials


def download_sample_files(user_audio_dir: Path):
    """Download sample MP3 files to the user's audio directory"""
    
    # Sample MP3 URLs (these are small, free sample files)
    sample_files = {
        "sample1.mp3": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        "sample2.mp3": "https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav", 
        "sample3.mp3": "https://www.soundjay.com/misc/sounds/phone-ring-1.wav"
    }
    
    print(f"📥 Downloading sample files to {user_audio_dir}...")
    
    downloaded_songs = []
    
    for filename, url in sample_files.items():
        filepath = user_audio_dir / filename
        
        if filepath.exists():
            print(f"✅ {filename} already exists")
            downloaded_songs.append(filepath)
            continue
            
        try:
            print(f"📥 Downloading {filename}...")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Downloaded {filename}")
            downloaded_songs.append(filepath)
            
        except Exception as e:
            print(f"❌ Failed to download {filename}: {e}")
    
    return downloaded_songs


def create_song_records(user_id: str, song_files: list, user_artwork_dir: Path):
    """Create song records in the database for the downloaded files"""
    songs_created = []
    
    for filepath in song_files:
        # Extract metadata from the file
        metadata = MetadataService.extract_metadata(str(filepath))
        
        # Extract album art if available
        album_art_path = None
        try:
            album_art_path = MetadataService.extract_album_art(
                str(filepath), 
                str(user_artwork_dir)
            )
        except Exception as e:
            print(f"⚠️ Could not extract album art for {filepath.name}: {e}")
        
        # Create song record using the utility function
        song_data = {
            "title": metadata.get("title") or filepath.stem,
            "artist": metadata.get("artist") or "Unknown Artist",
            "album": metadata.get("album") or "Unknown Album",
            "genre": metadata.get("genre"),
            "year": metadata.get("year"),
            "duration": metadata.get("duration", 0),
            "file_size": filepath.stat().st_size,
            "format": filepath.suffix[1:].lower(),
            "bitrate": metadata.get("bitrate"),
            "sample_rate": metadata.get("sample_rate"),
            "album_art_path": album_art_path,
        }
        
        song = test_data_manager.create_test_song(user_id, str(filepath), **song_data)
        print(f"✅ Created song record: {song.title} (ID: {song.id})")
        songs_created.append(song)
    
    return songs_created


def main():
    """Main function to set up test data"""
    print("🎵 Setting up StreamFlow test data...")
    print("=" * 50)
    
    # Step 0: Clean up existing test data
    print("🧹 Cleaning up existing test data...")
    test_data_manager.cleanup_all()
    
    # Step 1: Create test user
    print("👤 Creating test user...")
    test_user = test_data_manager.create_test_user()
    if not test_user:
        print("❌ Failed to create test user. Exiting.")
        return
    
    # Step 2: Create user directories
    print("📁 Creating user directories...")
    user_audio_dir, user_artwork_dir = test_data_manager.create_user_directories(test_user.id)
    
    # Step 3: Download sample files
    song_files = download_sample_files(user_audio_dir)
    if not song_files:
        print("❌ No sample files downloaded. Exiting.")
        return
    
    # Step 4: Create song records in database
    print("🎵 Creating song records...")
    songs = create_song_records(test_user.id, song_files, user_artwork_dir)
    
    # Get credentials for display
    credentials = get_test_user_credentials()
    
    print("\n🎉 Test data setup complete!")
    print("=" * 50)
    print(f"👤 Test user: {test_user.username} (ID: {test_user.id})")
    print(f"📧 Email: {credentials['email']}")
    print(f"🔑 Password: {credentials['password']}")
    print(f"🎵 Songs created: {len(songs)}")
    
    print("\n🧪 You can now test:")
    print("1. Login with test@streamflow.com / testpass123")
    print("2. View uploaded songs via GET /api/songs/")
    print("3. Stream songs via GET /api/stream/song/{song_id}")
    print("4. View album art via GET /api/stream/album-art/{song_id}")
    
    print("\n📁 Files are stored in:")
    print(f"   Audio: {user_audio_dir}")
    print(f"   Artwork: {user_artwork_dir}")


if __name__ == "__main__":
    main() 