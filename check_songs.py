#!/usr/bin/env python3
"""
Script to check songs in the database and identify duplicates.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.song import Song
from app.models.user import User

def check_songs():
    """Check songs in the database."""
    
    db = Session(engine)
    
    try:
        # Get all songs
        songs = db.query(Song).all()
        print(f"Total songs in database: {len(songs)}")
        print("\n" + "="*80)
        
        # Group songs by title and artist to find duplicates
        song_groups = {}
        for song in songs:
            key = f"{song.title} - {song.artist}"
            if key not in song_groups:
                song_groups[key] = []
            song_groups[key].append(song)
        
        # Show all songs with details
        for i, song in enumerate(songs, 1):
            print(f"{i:2d}. ID: {song.id[:8]}... | Title: '{song.title}' | Artist: '{song.artist}' | Uploaded by: {song.uploaded_by[:8]}...")
        
        print("\n" + "="*80)
        print("DUPLICATE ANALYSIS:")
        
        # Find duplicates
        duplicates_found = False
        for key, song_list in song_groups.items():
            if len(song_list) > 1:
                duplicates_found = True
                print(f"\nDUPLICATE: '{key}' ({len(song_list)} copies)")
                for song in song_list:
                    print(f"  - ID: {song.id[:8]}... | Uploaded by: {song.uploaded_by[:8]}... | Created: {song.created_at}")
        
        if not duplicates_found:
            print("No duplicates found!")
        
        # Show users
        print("\n" + "="*80)
        print("USERS:")
        users = db.query(User).all()
        for user in users:
            user_songs = db.query(Song).filter(Song.uploaded_by == user.id).count()
            print(f"User: {user.username} ({user.email}) | Role: {user.role} | Songs: {user_songs}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_songs() 