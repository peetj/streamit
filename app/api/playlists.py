from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.playlist import Playlist, PlaylistSong
from ..models.song import Song
from ..models.user import User
from ..services.auth_service import get_current_user, get_current_admin_user
from ..schemas.playlist import PlaylistCreate, PlaylistResponse, PlaylistUpdate, PlaylistSongAdd, PlaylistResponseWithOwner
from ..schemas.user import UserResponse
from ..schemas.song import SongResponse

router = APIRouter()

@router.post("/", response_model=PlaylistResponse)
async def create_playlist(
    playlist: PlaylistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new playlist.
    
    **Features:**
    - **Custom Names**: Create playlists with custom names
    - **Descriptions**: Add optional descriptions
    - **User Ownership**: Automatically assigned to current user
    
    **Examples:**
    ```json
    {
        "name": "My Favorite Rock Songs",
        "description": "A collection of my favorite rock music"
    }
    ```
    
    **Response:**
    - Playlist with ID, creation timestamp, and empty songs array
    """
    db_playlist = Playlist(
        name=playlist.name,
        description=playlist.description,
        owner_id=current_user.id
    )
    
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    
    return db_playlist

@router.get("/", response_model=List[PlaylistResponse])
async def get_playlists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get playlists.
    
    **Features:**
    - **Admin Access**: Admin users can see all playlists from all users
    - **User Isolation**: Regular users only see their own playlists
    - **Complete Data**: Includes playlist details and song count
    - **Sorted by Creation**: Newest playlists first
    
    **Examples:**
    - Get all playlists: `GET /api/playlists/`
    - Requires Authorization header: `Bearer <your_token>`
    
    **Response:**
    ```json
    [
        {
            "id": "playlist-uuid",
            "name": "My Favorite Rock Songs",
            "description": "A collection of my favorite rock music",
            "cover_image": null,
            "owner_id": "user-uuid",
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z",
            "songs": []
        }
    ]
    ```
    """
    # Admin users can see all playlists, regular users only their own
    if current_user.role == "admin":
        playlists = db.query(Playlist).all()
    else:
        playlists = db.query(Playlist).filter(Playlist.owner_id == current_user.id).all()
    
    # Build response manually to handle None values in songs
    result = []
    for pl in playlists:
        # Build songs list manually, filtering out None values
        songs = []
        for ps in pl.playlist_songs:
            if ps is not None and ps.song is not None:
                try:
                    song_response = SongResponse.from_orm(ps.song)
                    if song_response is not None:
                        songs.append(song_response)
                except Exception:
                    pass
        
        # Build playlist data manually
        pl_data = {
            "id": pl.id,
            "name": pl.name,
            "description": pl.description,
            "cover_image": pl.cover_image,
            "owner_id": pl.owner_id,
            "created_at": pl.created_at,
            "updated_at": pl.updated_at,
            "songs": songs
        }
        
        result.append(PlaylistResponse(**pl_data))
    
    return result

@router.get("/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist(
    playlist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.owner_id == current_user.id
    ).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return playlist

@router.put("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: str,
    playlist_update: PlaylistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.owner_id == current_user.id
    ).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    update_data = playlist_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(playlist, field, value)
    
    db.commit()
    db.refresh(playlist)
    
    return playlist

@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.owner_id == current_user.id
    ).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    db.delete(playlist)
    db.commit()
    
    return {"message": "Playlist deleted successfully"}

@router.post("/{playlist_id}/songs")
async def add_song_to_playlist(
    playlist_id: str,
    song_data: PlaylistSongAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify playlist ownership
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.owner_id == current_user.id
    ).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Verify song ownership - admins can add any song, regular users only their own
    if current_user.role == "admin":
        song = db.query(Song).filter(Song.id == song_data.song_id).first()
    else:
        song = db.query(Song).filter(
            Song.id == song_data.song_id,
            Song.uploaded_by == current_user.id
        ).first()
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Check if song already in playlist
    existing = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == playlist_id,
        PlaylistSong.song_id == song_data.song_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Song already in playlist")
    
    # Get next position
    if song_data.position is None:
        max_position = db.query(PlaylistSong).filter(
            PlaylistSong.playlist_id == playlist_id
        ).count()
        position = max_position
    else:
        position = song_data.position
    
    # Add song to playlist
    playlist_song = PlaylistSong(
        playlist_id=playlist_id,
        song_id=song_data.song_id,
        position=position
    )
    
    db.add(playlist_song)
    db.commit()
    
    return {"message": "Song added to playlist successfully"}

@router.delete("/{playlist_id}/songs/{song_id}")
async def remove_song_from_playlist(
    playlist_id: str,
    song_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify playlist ownership
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.owner_id == current_user.id
    ).first()
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Find and remove playlist song
    playlist_song = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == playlist_id,
        PlaylistSong.song_id == song_id
    ).first()
    
    if not playlist_song:
        raise HTTPException(status_code=404, detail="Song not found in playlist")
    
    db.delete(playlist_song)
    db.commit()
    
    return {"message": "Song removed from playlist successfully"}

@router.get("/admin/all", response_model=List[PlaylistResponseWithOwner])
async def get_all_playlists_admin(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all playlists from all users (Admin only).
    
    **Features:**
    - **Admin Only**: Only admin users can access this endpoint
    - **All Playlists**: Returns playlists from all users
    - **Complete Data**: Includes playlist details and song count
    
    **Examples:**
    - Get all playlists: `GET /api/playlists/admin/all`
    - Requires Admin Authorization header: `Bearer <admin_token>`
    """
    playlists = db.query(Playlist).all()
    result = []
    for pl in playlists:
        # Get owner info
        owner = UserResponse.from_orm(pl.owner) if pl.owner else None
        
        # Build songs list manually, filtering out None values
        songs = []
        for ps in pl.playlist_songs:
            if ps is not None and ps.song is not None:
                try:
                    song_response = SongResponse.from_orm(ps.song)
                    if song_response is not None:
                        songs.append(song_response)
                except Exception:
                    pass
        
        # Build playlist data manually to avoid from_orm issues
        pl_data = {
            "id": pl.id,
            "name": pl.name,
            "description": pl.description,
            "cover_image": pl.cover_image,
            "owner_id": pl.owner_id,
            "created_at": pl.created_at,
            "updated_at": pl.updated_at,
            "songs": songs,
            "owner": owner
        }
        
        result.append(PlaylistResponseWithOwner(**pl_data))
    return result