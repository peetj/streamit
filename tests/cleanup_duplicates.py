#!/usr/bin/env python3
"""
Script to remove duplicate songs from the database.
Keeps the oldest version of each song and removes newer duplicates.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.song import Song
import os

def cleanup_duplicates():
    """Remove duplicate songs from the database."""
    
    db = Session(engine)
    
    try:
        # Get all songs
        songs = db.query(Song).all()
        print(f"Total songs before cleanup: {len(songs)}")
        
        # Group songs by title and artist
        song_groups = {}
        for song in songs:
            key = f"{song.title} - {song.artist}"
            if key not in song_groups:
                song_groups[key] = []
            song_groups[key].append(song)
        
        # Find and remove duplicates
        songs_to_delete = []
        for key, song_list in song_groups.items():
            if len(song_list) > 1:
                print(f"\nFound {len(song_list)} copies of '{key}'")
                
                # Sort by creation date (oldest first)
                song_list.sort(key=lambda x: x.created_at)
                
                # Keep the oldest one, mark others for deletion
                oldest = song_list[0]
                duplicates = song_list[1:]
                
                print(f"  Keeping: {oldest.id[:8]}... (created: {oldest.created_at})")
                
                for duplicate in duplicates:
                    print(f"  Deleting: {duplicate.id[:8]}... (created: {duplicate.created_at})")
                    songs_to_delete.append(duplicate)
        
        if songs_to_delete:
            print(f"\nDeleting {len(songs_to_delete)} duplicate songs...")
            
            for song in songs_to_delete:
                # Delete the file
                if os.path.exists(song.file_path):
                    os.remove(song.file_path)
                    print(f"  Deleted file: {song.file_path}")
                
                # Delete album art
                if song.album_art_path and os.path.exists(song.album_art_path):
                    os.remove(song.album_art_path)
                    print(f"  Deleted album art: {song.album_art_path}")
                
                # Delete from database
                db.delete(song)
            
            db.commit()
            print(f"✅ Successfully deleted {len(songs_to_delete)} duplicate songs!")
        else:
            print("No duplicates found to clean up.")
        
        # Show final count
        final_songs = db.query(Song).all()
        print(f"\nTotal songs after cleanup: {len(final_songs)}")
        
        # Show remaining songs
        print("\nRemaining songs:")
        for i, song in enumerate(final_songs, 1):
            print(f"{i}. {song.title} - {song.artist} (ID: {song.id[:8]}...)")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicates() 