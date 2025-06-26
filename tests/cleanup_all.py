#!/usr/bin/env python3
"""
Comprehensive cleanup script for StreamFlow:
- Removes duplicate songs (keeps oldest, deletes newer duplicates and their files)
- Removes orphaned files in uploads/audio/ and uploads/artwork/ not referenced in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.song import Song
from app.models.user import User

AUDIO_DIR = os.path.join('uploads', 'audio')
ARTWORK_DIR = os.path.join('uploads', 'artwork')

def cleanup_duplicates(db):
    print("\n=== Duplicate Song Cleanup ===")
    songs = db.query(Song).all()
    song_groups = {}
    for song in songs:
        key = f"{song.title} - {song.artist}"
        if key not in song_groups:
            song_groups[key] = []
        song_groups[key].append(song)
    songs_to_delete = []
    for key, song_list in song_groups.items():
        if len(song_list) > 1:
            print(f"\nFound {len(song_list)} copies of '{key}'")
            song_list.sort(key=lambda x: x.created_at)
            oldest = song_list[0]
            duplicates = song_list[1:]
            print(f"  Keeping: {oldest.id[:8]}... (created: {oldest.created_at})")
            for duplicate in duplicates:
                print(f"  Deleting: {duplicate.id[:8]}... (created: {duplicate.created_at})")
                songs_to_delete.append(duplicate)
    for song in songs_to_delete:
        if song.file_path and os.path.exists(song.file_path):
            os.remove(song.file_path)
            print(f"  Deleted file: {song.file_path}")
        if song.album_art_path and os.path.exists(song.album_art_path):
            os.remove(song.album_art_path)
            print(f"  Deleted album art: {song.album_art_path}")
        db.delete(song)
    if songs_to_delete:
        db.commit()
        print(f"✅ Deleted {len(songs_to_delete)} duplicate songs!")
    else:
        print("No duplicates found.")

def cleanup_orphaned_files(db):
    print("\n=== Orphaned File Cleanup ===")
    # Get all referenced files
    songs = db.query(Song).all()
    referenced_audio = set(os.path.abspath(song.file_path) for song in songs if song.file_path)
    referenced_artwork = set(os.path.abspath(song.album_art_path) for song in songs if song.album_art_path)
    # Check audio files
    for root, dirs, files in os.walk(AUDIO_DIR):
        for file in files:
            file_path = os.path.abspath(os.path.join(root, file))
            if file_path not in referenced_audio:
                os.remove(file_path)
                print(f"Deleted orphaned audio file: {file_path}")
    # Check artwork files
    for root, dirs, files in os.walk(ARTWORK_DIR):
        for file in files:
            file_path = os.path.abspath(os.path.join(root, file))
            if file_path not in referenced_artwork:
                os.remove(file_path)
                print(f"Deleted orphaned artwork file: {file_path}")

def main():
    db = Session(engine)
    try:
        cleanup_duplicates(db)
        cleanup_orphaned_files(db)
        print("\nCleanup complete!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main() 