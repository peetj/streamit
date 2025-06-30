from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models.song import Song, ListeningSession
from ..models.user import User
from ..services.auth_service import get_current_user, get_current_admin_user
from ..services.file_service import FileService
from ..services.metadata_service import MetadataService
from ..config import settings
from ..schemas.song import SongResponse, SongUpload
from pydantic import BaseModel

router = APIRouter()

class ListeningSessionCompleteRequest(BaseModel):
    duration_seconds: float

# Upload routes moved to end of file to fix route order conflicts

@router.get("/", response_model=List[SongResponse])
async def get_songs(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    genre: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a list of songs.
    
    **Features:**
    - **Pagination**: Use `skip` and `limit` for large collections
    - **Search**: Filter by title, artist, or album (case-insensitive)
    - **Genre Filter**: Filter by specific genre
    - **Role-based Access**: 
      - Regular users see only their own songs
      - Admin users see all songs in the library
    
    **Examples:**
    - Get all songs: `GET /api/songs/`
    - Search for "rock" songs: `GET /api/songs/?search=rock`
    - Filter by genre: `GET /api/songs/?genre=Jazz`
    - Pagination: `GET /api/songs/?skip=10&limit=5`
    - Combined filters: `GET /api/songs/?search=beatles&genre=Rock&skip=0&limit=20`
    """
    # Admin users can see all songs, regular users only their own
    if current_user.role == "admin":
        query = db.query(Song)
    else:
        query = db.query(Song).filter(Song.uploaded_by == current_user.id)
    
    if search:
        query = query.filter(
            Song.title.ilike(f"%{search}%") |
            Song.artist.ilike(f"%{search}%") |
            Song.album.ilike(f"%{search}%")
        )
    
    if genre:
        query = query.filter(Song.genre == genre)
    
    songs = query.offset(skip).limit(limit).all()
    return songs

@router.post("/upload/", response_model=SongResponse)
async def upload_song(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    album: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    user_id: Optional[str] = Form(None),  # Allow admin to specify user
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a new audio file to your library.
    
    **Features:**
    - **Automatic Metadata Extraction**: Extracts title, artist, album, etc. from audio file
    - **Manual Override**: You can override extracted metadata with form fields
    - **Album Art Extraction**: Automatically extracts and saves album artwork
    - **File Validation**: Validates file format and size
    - **User Ownership**: Songs are automatically assigned to the uploading user
    - **Admin Override**: Admins can specify which user should own the song
    
    **Supported Formats:** MP3, WAV, FLAC, M4A, OGG
    
    **Examples:**
    - Upload with auto-extracted metadata: Just upload the file
    - Override title: Set `title` form field
    - Override artist: Set `artist` form field
    - Set custom genre: Set `genre` form field
    - Set release year: Set `year` form field (e.g., 2024)
    - Assign to specific user: Set `user_id` form field (admin only)
    
    **Form Data Examples:**
    ```
    file: [audio file]
    title: "My Custom Title"
    artist: "My Custom Artist"
    album: "My Custom Album"
    genre: "Rock"
    year: 2024
    user_id: "user-uuid-here"  # Admin only
    ```
    """
    print(f"Upload request received: {file.filename}, size: {file.size}, user: {current_user.username}")
    
    # Determine which user should own the song
    if user_id and current_user.role == "admin":
        # Admin is uploading on behalf of another user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            print(f"Target user not found: {user_id}")
            raise HTTPException(status_code=404, detail="Target user not found")
        song_owner_id = user_id
        print(f"Admin uploading for user: {target_user.username}")
    else:
        # Upload to current user's library
        song_owner_id = current_user.id
        print(f"User uploading to own library: {current_user.username}")
    
    # Validate file
    if not file.filename:
        print("No filename provided")
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not FileService.is_valid_audio_file(file.filename):
        print(f"Invalid file format: {file.filename}")
        raise HTTPException(status_code=400, detail=f"Invalid audio file format. Supported formats: {', '.join(settings.allowed_extensions)}")
    
    if file.size > settings.max_file_size:
        print(f"File too large: {file.size} bytes (max: {settings.max_file_size})")
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {settings.max_file_size // 1000000}MB")
    
    # Save file
    try:
        file_path = await FileService.save_uploaded_file(file, song_owner_id)
        print(f"File saved to: {file_path}")
    except Exception as e:
        print(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    try:
        # Extract metadata
        print("Extracting metadata...")
        metadata = MetadataService.extract_metadata(file_path)
        print(f"Metadata extracted: {metadata}")
        
        # Use provided metadata or fallback to extracted
        song_data = {
            "title": title or metadata.get("title") or file.filename,
            "artist": artist or metadata.get("artist") or "Unknown Artist",
            "album": album or metadata.get("album") or "Unknown Album",
            "genre": genre or metadata.get("genre"),
            "year": year or metadata.get("year"),
            "duration": metadata.get("duration", 0),
            "file_path": file_path,
            "file_size": file.size,
            "format": file.filename.split(".")[-1].lower(),
            "bitrate": metadata.get("bitrate"),
            "sample_rate": metadata.get("sample_rate"),
            "uploaded_by": song_owner_id
        }
        
        # Extract album art
        print("Extracting album art...")
        album_art_path = MetadataService.extract_album_art(
            file_path, 
            os.path.join(settings.upload_dir, "artwork", f"{song_owner_id}")
        )
        if album_art_path:
            song_data["album_art_path"] = album_art_path
            print(f"Album art saved to: {album_art_path}")
        
        # Save to database
        print("Saving to database...")
        db_song = Song(**song_data)
        db.add(db_song)
        db.commit()
        db.refresh(db_song)
        print(f"Song saved to database with ID: {db_song.id}")
        
        return db_song
        
    except Exception as e:
        # Clean up file if database save fails
        print(f"Error processing file: {e}")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Cleaned up file: {file_path}")
            except Exception as cleanup_error:
                print(f"Error cleaning up file: {cleanup_error}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/upload-for-user/{user_id}/", response_model=SongResponse)
async def upload_song_for_user(
    user_id: str,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    album: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Upload a song on behalf of a specific user (Admin only).
    
    **Features:**
    - **Admin Only**: Only admin users can use this endpoint
    - **User Assignment**: Song is automatically assigned to the specified user
    - **All Standard Features**: Metadata extraction, album art, validation
    
    **Examples:**
    - Upload for test user: `POST /api/songs/upload-for-user/{test-user-id}`
    """
    # Verify target user exists
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    # Validate file
    if not FileService.is_valid_audio_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid audio file format")
    
    if file.size > settings.max_file_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Save file
    file_path = await FileService.save_uploaded_file(file, user_id)
    
    try:
        # Extract metadata
        metadata = MetadataService.extract_metadata(file_path)
        
        # Use provided metadata or fallback to extracted
        song_data = {
            "title": title or metadata.get("title") or file.filename,
            "artist": artist or metadata.get("artist") or "Unknown Artist",
            "album": album or metadata.get("album") or "Unknown Album",
            "genre": genre or metadata.get("genre"),
            "year": year or metadata.get("year"),
            "duration": metadata.get("duration", 0),
            "file_path": file_path,
            "file_size": file.size,
            "format": file.filename.split(".")[-1].lower(),
            "bitrate": metadata.get("bitrate"),
            "sample_rate": metadata.get("sample_rate"),
            "uploaded_by": user_id
        }
        
        # Extract album art
        album_art_path = MetadataService.extract_album_art(
            file_path, 
            os.path.join(settings.upload_dir, "artwork", f"{user_id}")
        )
        if album_art_path:
            song_data["album_art_path"] = album_art_path
        
        # Save to database
        db_song = Song(**song_data)
        db.add(db_song)
        db.commit()
        db.refresh(db_song)
        
        return db_song
        
    except Exception as e:
        # Clean up file if database save fails
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/liked/", response_model=List[SongResponse])
async def get_liked_songs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all liked songs for the current user.
    
    **Features:**
    - **User Specific**: Returns only the current user's liked songs
    - **Full Metadata**: Returns complete song information for each liked song
    - **Ordered**: Songs are returned in the order they were liked (most recent first)
    
    **Examples:**
    - Get liked songs: `GET /api/songs/liked`
    
    **Response includes:**
    - All song metadata (title, artist, album, genre, year, duration, etc.)
    - Album art paths for streaming
    - Upload and like timestamps
    """
    # Refresh the user object to get the latest liked_songs relationship
    db.refresh(current_user)
    
    # Return liked songs in reverse order (most recently liked first)
    return list(reversed(current_user.liked_songs))

@router.get("/{song_id}/", response_model=SongResponse)
async def get_song(
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific song by ID.
    
    **Features:**
    - **Full Metadata**: Returns complete song information
    - **Role-based Access**: 
      - Regular users can only access their own songs
      - Admin users can access any song in the library
    - **Album Art Path**: Includes path to album artwork if available
    
    **Examples:**
    - Get song details: `GET /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258`
    
    **Response includes:**
    - Basic info (title, artist, album, genre, year)
    - Technical details (duration, file size, format, bitrate, sample rate)
    - Album art path for streaming
    - Upload timestamp
    """
    # Admin users can view any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return song

@router.delete("/{song_id}/")
async def delete_song(
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a song from the library.
    
    **Features:**
    - **Complete Removal**: Deletes song file, album art, and database record
    - **User Ownership**: Users can only delete their own songs
    - **Admin Access**: Admin users can delete any song
    - **File Cleanup**: Automatically removes associated files from storage
    
    **Examples:**
    - Delete song: `DELETE /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258`
    
    **What gets deleted:**
    - Audio file from storage
    - Album artwork (if exists)
    - Database record
    - All playlist associations
    """
    # Admin users can delete any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Delete file
    if os.path.exists(song.file_path):
        os.remove(song.file_path)
    
    # Delete album art
    if song.album_art_path and os.path.exists(song.album_art_path):
        os.remove(song.album_art_path)
    
    # Delete from database
    db.delete(song)
    db.commit()
    
    return {"message": "Song deleted successfully"}

@router.post("/{song_id}/like/")
async def like_song(
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Like a song.
    
    **Features:**
    - **User Ownership**: Users can only like songs they have access to
    - **Admin Access**: Admin users can like any song
    - **Duplicate Prevention**: If already liked, returns success without error
    
    **Examples:**
    - Like song: `POST /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258/like`
    """
    # Admin users can like any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Check if already liked
    if song in current_user.liked_songs:
        return {"message": "Song already liked"}
    
    # Add to liked songs
    current_user.liked_songs.append(song)
    db.commit()
    
    return {"message": "Song liked successfully"}

@router.post("/{song_id}/unlike/")
async def unlike_song(
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlike a song.
    
    **Features:**
    - **User Ownership**: Users can only unlike songs they have access to
    - **Admin Access**: Admin users can unlike any song
    - **Safe Operation**: If not liked, returns success without error
    
    **Examples:**
    - Unlike song: `POST /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258/unlike`
    """
    # Admin users can unlike any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Check if already unliked
    if song not in current_user.liked_songs:
        return {"message": "Song not in liked songs"}
    
    # Remove from liked songs
    current_user.liked_songs.remove(song)
    db.commit()
    
    return {"message": "Song unliked successfully"}

@router.post("/{song_id}/play/")
async def increment_play_count(
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Increment the play count for a song.
    
    **Features:**
    - **User Ownership**: Users can only increment play count for songs they have access to
    - **Admin Access**: Admin users can increment play count for any song
    - **Automatic Increment**: Play count is incremented by 1 each time this endpoint is called
    
    **Examples:**
    - Increment play count: `POST /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258/play`
    """
    # Admin users can increment play count for any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Increment play count
    song.play_count = (song.play_count or 0) + 1
    db.commit()
    
    return {"message": "Play count incremented", "play_count": song.play_count}

@router.post("/{song_id}/listen/")
async def track_listening_session(
    song_id: str,
    playlist_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start tracking a listening session for a song.
    
    **Features:**
    - **User Ownership**: Users can only track listening sessions for songs they have access to
    - **Admin Access**: Admin users can track listening sessions for any song
    - **Playlist Tracking**: Optionally track which playlist the song was played from
    
    **Examples:**
    - Track listening session: `POST /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258/listen`
    - Track from playlist: `POST /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258/listen?playlist_id=playlist-uuid`
    """
    # Admin users can track listening sessions for any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Track listening session
    listening_session = ListeningSession(
        song_id=song_id,
        user_id=current_user.id,
        playlist_id=playlist_id,
        duration_seconds=0.0,  # Will be updated when session ends
        started_at=datetime.utcnow(),
        ended_at=datetime.utcnow()  # Will be updated when session ends
    )
    db.add(listening_session)
    db.commit()
    db.refresh(listening_session)
    
    return {"message": "Listening session started", "session_id": listening_session.id}

@router.put("/{song_id}/listen/{session_id}/")
async def complete_listening_session(
    song_id: str,
    session_id: str,
    data: ListeningSessionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete a listening session with the actual duration listened.
    
    **Features:**
    - **Duration Tracking**: Record how long the song was actually listened to
    - **Session Validation**: Only the session owner can complete their own sessions
    
    **Examples:**
    - Complete session: `PUT /api/songs/ee0caa92-d04d-4442-9f0f-8698bab28258/listen/session-uuid`
    - Body: `{"duration_seconds": 180.5}`
    """
    # Find the listening session
    session = db.query(ListeningSession).filter(
        ListeningSession.id == session_id,
        ListeningSession.song_id == song_id,
        ListeningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Listening session not found")
    
    # Update session with duration and end time
    session.duration_seconds = data.duration_seconds
    session.ended_at = datetime.utcnow()
    
    # Also increment play count for the song
    song = db.query(Song).filter(Song.id == song_id).first()
    if song:
        song.play_count = (song.play_count or 0) + 1
    
    db.commit()
    
    return {"message": "Listening session completed", "duration_seconds": data.duration_seconds}