from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
import os
import mimetypes
from sqlalchemy.orm import Session
from ..services.auth_service import get_current_user
from ..database import get_db
from ..models.user import User
from ..models.song import Song

router = APIRouter()

def parse_range_header(range_header: str, file_size: int):
    """Parse HTTP Range header"""
    try:
        range_match = range_header.replace('bytes=', '').split('-')
        byte_start = int(range_match[0]) if range_match[0] else 0
        byte_end = int(range_match[1]) if range_match[1] else file_size - 1
        
        if byte_start >= file_size:
            byte_start = file_size - 1
        if byte_end >= file_size:
            byte_end = file_size - 1
            
        return byte_start, byte_end
    except:
        return 0, file_size - 1

@router.get("/song/{song_id}/")
async def stream_song(
    song_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stream an audio file for playback.
    
    **Features:**
    - **Range Requests**: Supports HTTP Range headers for seeking
    - **Progressive Download**: Streams audio in chunks
    - **Content-Type Detection**: Automatically detects audio format
    - **Role-based Access**: 
      - Regular users can only stream their own songs
      - Admin users can stream any song in the library
    
    **Examples:**
    - Stream full song: `GET /api/stream/song/ee0caa92-d04d-4442-9f0f-8698bab28258`
    - Stream with range (for seeking): `GET /api/stream/song/ee0caa92-d04d-4442-9f0f-8698bab28258`
      with header: `Range: bytes=0-1048575`
    
    **Usage in HTML5 Audio:**
    ```html
    <audio controls>
        <source src="/api/stream/song/ee0caa92-d04d-4442-9f0f-8698bab28258" type="audio/mpeg">
    </audio>
    ```
    
    **Response Headers:**
    - `Content-Type`: Audio MIME type (e.g., audio/mpeg)
    - `Accept-Ranges`: bytes (for seeking support)
    - `Content-Length`: File size in bytes
    """
    # Admin users can stream any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    file_path = song.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    file_size = os.path.getsize(file_path)
    
    # Get content type
    content_type = mimetypes.guess_type(file_path)[0] or 'audio/mpeg'
    
    # Handle range requests for audio streaming
    range_header = request.headers.get('range')
    
    if range_header:
        byte_start, byte_end = parse_range_header(range_header, file_size)
        
        def iterfile(file_path: str, start: int, end: int):
            with open(file_path, 'rb') as file_like:
                file_like.seek(start)
                remaining = end - start + 1
                while remaining:
                    chunk_size = min(8192, remaining)
                    chunk = file_like.read(chunk_size)
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        
        content_length = byte_end - byte_start + 1
        headers = {
            'Content-Range': f'bytes {byte_start}-{byte_end}/{file_size}',
            'Accept-Ranges': 'bytes',
            'Content-Length': str(content_length),
            'Content-Type': content_type,
        }
        
        return StreamingResponse(
            iterfile(file_path, byte_start, byte_end),
            status_code=206,
            headers=headers
        )
    
    # Full file streaming
    def iterfile():
        with open(file_path, 'rb') as file_like:
            yield from file_like
    
    headers = {
        'Content-Length': str(file_size),
        'Accept-Ranges': 'bytes',
        'Content-Type': content_type,
    }
    
    return StreamingResponse(iterfile(), headers=headers)

@router.get("/album-art/{song_id}/")
async def get_album_art(
    song_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get album artwork for a song.
    
    **Features:**
    - **Image Streaming**: Streams album art as image data
    - **Role-based Access**: 
      - Regular users can only access album art for their own songs
      - Admin users can access album art for any song in the library
    - **Automatic Format Detection**: Supports JPEG, PNG, etc.
    
    **Examples:**
    - Get album art: `GET /api/stream/album-art/ee0caa92-d04d-4442-9f0f-8698bab28258`
    
    **Usage in HTML:**
    ```html
    <img src="/api/stream/album-art/ee0caa92-d04d-4442-9f0f-8698bab28258" alt="Album Art">
    ```
    
    **Response:**
    - `Content-Type`: image/jpeg (or detected format)
    - Body: Raw image data
    """
    # Admin users can access any album art, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song or not song.album_art_path:
        raise HTTPException(status_code=404, detail="Album art not found")
    
    if not os.path.exists(song.album_art_path):
        raise HTTPException(status_code=404, detail="Album art file not found")
    
    def iterfile():
        with open(song.album_art_path, 'rb') as file_like:
            yield from file_like
    
    return StreamingResponse(iterfile(), media_type='image/jpeg')