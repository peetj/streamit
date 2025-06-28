#!/usr/bin/env python3
"""
Debug script to check listening sessions in the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.song import ListeningSession
from app.models.user import User
from app.models.playlist import Playlist
from sqlalchemy import func

def check_listening_sessions():
    """Check all listening sessions in the database."""
    db = SessionLocal()
    
    try:
        print("=== Listening Sessions Debug ===\n")
        
        # Get all listening sessions
        sessions = db.query(ListeningSession).all()
        print(f"Total listening sessions: {len(sessions)}")
        
        if not sessions:
            print("No listening sessions found in database.")
            return
        
        print("\n=== All Listening Sessions ===")
        for session in sessions:
            print(f"Session ID: {session.id}")
            print(f"  User ID: {session.user_id}")
            print(f"  Song ID: {session.song_id}")
            print(f"  Playlist ID: {session.playlist_id}")
            print(f"  Duration: {session.duration_seconds} seconds")
            print(f"  Started: {session.started_at}")
            print(f"  Ended: {session.ended_at}")
            print()
        
        # Get user info
        users = db.query(User).all()
        print(f"\n=== Users ===")
        for user in users:
            print(f"User: {user.username} ({user.email}) - ID: {user.id}")
        
        # Get playlists
        playlists = db.query(Playlist).all()
        print(f"\n=== Playlists ===")
        for playlist in playlists:
            print(f"Playlist: {playlist.name} - ID: {playlist.id} - Owner: {playlist.owner_id}")
        
        # Check for sessions with non-zero duration
        non_zero_sessions = db.query(ListeningSession).filter(ListeningSession.duration_seconds > 0).all()
        print(f"\n=== Sessions with Non-Zero Duration ===")
        print(f"Count: {len(non_zero_sessions)}")
        
        for session in non_zero_sessions:
            print(f"Session {session.id}: {session.duration_seconds} seconds")
        
        # Check for sessions with playlist_id
        playlist_sessions = db.query(ListeningSession).filter(ListeningSession.playlist_id.isnot(None)).all()
        print(f"\n=== Sessions with Playlist ID ===")
        print(f"Count: {len(playlist_sessions)}")
        
        for session in playlist_sessions:
            print(f"Session {session.id}: Playlist {session.playlist_id}, Duration: {session.duration_seconds}s")
        
        # Test the stats query
        if playlists:
            test_playlist = playlists[0]
            print(f"\n=== Testing Stats for Playlist: {test_playlist.name} ===")
            
            total_seconds = db.query(func.sum(ListeningSession.duration_seconds)).filter(
                ListeningSession.playlist_id == test_playlist.id
            ).scalar() or 0.0
            
            print(f"Total listening seconds: {total_seconds}")
            print(f"Total listening minutes: {total_seconds / 60:.2f}")
            
            # Check by user too
            if users:
                test_user = users[0]
                user_total_seconds = db.query(func.sum(ListeningSession.duration_seconds)).filter(
                    ListeningSession.playlist_id == test_playlist.id,
                    ListeningSession.user_id == test_user.id
                ).scalar() or 0.0
                
                print(f"User {test_user.username} total seconds: {user_total_seconds}")
                print(f"User {test_user.username} total minutes: {user_total_seconds / 60:.2f}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_listening_sessions() 