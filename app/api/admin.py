from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import os
import shutil
from typing import List, Dict, Any
from pathlib import Path

from app.database import get_db
from app.models.user import User
from app.models.song import Song
from app.services.auth_service import get_current_admin_user
from app.schemas.admin import CleanupRequest, CleanupResponse

router = APIRouter(tags=["admin"])


@router.post("/cleanup/", response_model=CleanupResponse)
async def run_cleanup(
    request: CleanupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Run database and file cleanup operations.
    
    - **dry_run**: If True, only shows what would be cleaned without making changes
    - **mode**: Either 'dry-run' or 'full' cleanup
    """
    
    print(f"Cleanup endpoint called with mode: {request.mode}, dry_run: {request.dry_run}")
    print(f"User: {current_user.username} (role: {current_user.role})")
    
    duplicates_removed = 0
    orphaned_audio_removed = 0
    orphaned_artwork_removed = 0
    space_saved = 0
    duplicate_details = []
    orphaned_files = []
    
    try:
        # Step 1: Find and handle duplicates
        print("Finding duplicate songs...")
        duplicates = find_duplicate_songs(db)
        print(f"Found {len(duplicates)} duplicate groups")
        
        duplicate_details = [
            {
                "title": dup.title,
                "artist": dup.artist,
                "count": dup.count
            }
            for dup in duplicates
        ]
        
        if not request.dry_run:
            print("Removing duplicate songs...")
            duplicates_removed = remove_duplicate_songs(db, duplicates)
        
        # Step 2: Find and handle orphaned files
        print("Finding orphaned files...")
        orphaned_audio, orphaned_artwork = find_orphaned_files(db)
        orphaned_files = orphaned_audio + orphaned_artwork
        print(f"Found {len(orphaned_audio)} orphaned audio files and {len(orphaned_artwork)} orphaned artwork files")
        
        if not request.dry_run:
            print("Removing orphaned files...")
            orphaned_audio_removed, orphaned_artwork_removed, space_saved = remove_orphaned_files(
                orphaned_audio, orphaned_artwork
            )
        
        result = CleanupResponse(
            duplicates_removed=duplicates_removed,
            orphaned_audio_removed=orphaned_audio_removed,
            orphaned_artwork_removed=orphaned_artwork_removed,
            space_saved=space_saved,
            duplicate_details=duplicate_details,
            orphaned_files=orphaned_files[:20]  # Limit to first 20 for display
        )
        
        print(f"Cleanup completed successfully: {result}")
        return result
        
    except Exception as e:
        print(f"Cleanup failed with error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )


def find_duplicate_songs(db: Session) -> List[Dict[str, Any]]:
    """Find songs with identical title, artist, and album."""
    duplicates = db.query(
        Song.title,
        Song.artist,
        Song.album,
        func.count(Song.id).label('count')
    ).filter(
        and_(
            Song.title.isnot(None),
            Song.artist.isnot(None)
        )
    ).group_by(
        Song.title,
        Song.artist,
        Song.album
    ).having(
        func.count(Song.id) > 1
    ).all()
    
    return duplicates


def remove_duplicate_songs(db: Session, duplicates: List[Dict[str, Any]]) -> int:
    """Remove duplicate songs, keeping the oldest one."""
    total_removed = 0
    
    for dup in duplicates:
        # Get all songs with this title, artist, and album
        songs = db.query(Song).filter(
            and_(
                Song.title == dup.title,
                Song.artist == dup.artist,
                Song.album == dup.album
            )
        ).order_by(Song.created_at).all()
        
        # Keep the oldest song, remove the rest
        for song in songs[1:]:
            # Remove associated files
            if song.file_path and os.path.exists(song.file_path):
                try:
                    os.remove(song.file_path)
                except OSError:
                    pass  # File might already be gone
            
            if song.album_art_path and os.path.exists(song.album_art_path):
                try:
                    os.remove(song.album_art_path)
                except OSError:
                    pass  # File might already be gone
            
            # Remove from database
            db.delete(song)
            total_removed += 1
    
    db.commit()
    return total_removed


def find_orphaned_files(db: Session) -> tuple[List[str], List[str]]:
    """Find audio and artwork files that aren't linked to any songs."""
    orphaned_audio = []
    orphaned_artwork = []
    
    # Get all song file paths from database
    songs = db.query(Song).all()
    db_audio_paths = {song.file_path for song in songs if song.file_path}
    db_artwork_paths = {song.album_art_path for song in songs if song.album_art_path}
    
    # Check uploads/audio directory
    audio_dir = Path("uploads/audio")
    if audio_dir.exists():
        for audio_file in audio_dir.rglob("*"):
            if audio_file.is_file():
                file_path = str(audio_file)
                if file_path not in db_audio_paths:
                    orphaned_audio.append(file_path)
    
    # Check uploads/artwork directory
    artwork_dir = Path("uploads/artwork")
    if artwork_dir.exists():
        for artwork_file in artwork_dir.rglob("*"):
            if artwork_file.is_file():
                file_path = str(artwork_file)
                if file_path not in db_artwork_paths:
                    orphaned_artwork.append(file_path)
    
    return orphaned_audio, orphaned_artwork


def remove_orphaned_files(orphaned_audio: List[str], orphaned_artwork: List[str]) -> tuple[int, int, int]:
    """Remove orphaned files and return counts and space saved."""
    audio_removed = 0
    artwork_removed = 0
    total_space_saved = 0
    
    # Remove orphaned audio files
    for file_path in orphaned_audio:
        try:
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                os.remove(file_path)
                audio_removed += 1
                total_space_saved += file_size
        except OSError:
            pass  # File might already be gone or locked
    
    # Remove orphaned artwork files
    for file_path in orphaned_artwork:
        try:
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                os.remove(file_path)
                artwork_removed += 1
                total_space_saved += file_size
        except OSError:
            pass  # File might already be gone or locked
    
    return audio_removed, artwork_removed, total_space_saved


@router.get("/test-filesystem/")
async def test_filesystem_permissions(
    current_user: User = Depends(get_current_admin_user)
):
    """
    Test file system permissions and directory creation capabilities.
    This helps diagnose upload issues in production environments.
    """
    results = {
        "current_working_directory": os.getcwd(),
        "environment": {
            "RAILWAY_ENVIRONMENT": os.getenv("RAILWAY_ENVIRONMENT"),
            "DATABASE_URL": "SET" if os.getenv("DATABASE_URL") else "NOT_SET",
            "PORT": os.getenv("PORT"),
        },
        "directory_tests": {},
        "file_tests": {},
        "permissions": {}
    }
    
    # Test directory creation
    test_dirs = [
        "uploads",
        "uploads/audio", 
        "uploads/artwork",
        "uploads/profile",
        "test_temp_dir"
    ]
    
    for test_dir in test_dirs:
        try:
            path = Path(test_dir)
            path.mkdir(exist_ok=True)
            results["directory_tests"][test_dir] = {
                "status": "SUCCESS",
                "exists": path.exists(),
                "is_dir": path.is_dir(),
                "writable": os.access(path, os.W_OK) if path.exists() else False
            }
            print(f"✅ Directory test passed: {test_dir}")
        except PermissionError as e:
            results["directory_tests"][test_dir] = {
                "status": "PERMISSION_ERROR",
                "error": str(e)
            }
            print(f"❌ Permission error creating directory: {test_dir} - {e}")
        except Exception as e:
            results["directory_tests"][test_dir] = {
                "status": "ERROR",
                "error": str(e)
            }
            print(f"❌ Error creating directory: {test_dir} - {e}")
    
    # Test file writing
    test_files = [
        "uploads/test_write.txt",
        "test_temp_dir/test_file.txt"
    ]
    
    for test_file in test_files:
        try:
            path = Path(test_file)
            # Ensure parent directory exists
            path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write test content
            with open(path, 'w') as f:
                f.write("Test content for file system permissions")
            
            # Check if file was created
            file_exists = path.exists()
            file_size = path.stat().st_size if file_exists else 0
            
            results["file_tests"][test_file] = {
                "status": "SUCCESS",
                "exists": file_exists,
                "size": file_size,
                "writable": os.access(path, os.W_OK) if file_exists else False
            }
            print(f"✅ File write test passed: {test_file}")
            
            # Clean up test file
            try:
                path.unlink()
                print(f"🧹 Cleaned up test file: {test_file}")
            except Exception as e:
                print(f"⚠️ Could not clean up test file {test_file}: {e}")
                
        except PermissionError as e:
            results["file_tests"][test_file] = {
                "status": "PERMISSION_ERROR",
                "error": str(e)
            }
            print(f"❌ Permission error writing file: {test_file} - {e}")
        except Exception as e:
            results["file_tests"][test_file] = {
                "status": "ERROR",
                "error": str(e)
            }
            print(f"❌ Error writing file: {test_file} - {e}")
    
    # Test permissions on existing directories
    existing_dirs = ["uploads", "app", "admin"]
    for existing_dir in existing_dirs:
        path = Path(existing_dir)
        if path.exists():
            results["permissions"][existing_dir] = {
                "exists": True,
                "is_dir": path.is_dir(),
                "readable": os.access(path, os.R_OK),
                "writable": os.access(path, os.W_OK),
                "executable": os.access(path, os.X_OK)
            }
        else:
            results["permissions"][existing_dir] = {
                "exists": False
            }
    
    # Clean up test directory
    try:
        test_temp = Path("test_temp_dir")
        if test_temp.exists():
            shutil.rmtree(test_temp)
            print("🧹 Cleaned up test temporary directory")
    except Exception as e:
        print(f"⚠️ Could not clean up test temporary directory: {e}")
    
    return results 