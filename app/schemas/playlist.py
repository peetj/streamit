from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .song import SongResponse
from .user import UserResponse

class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None

class PlaylistResponse(PlaylistBase):
    id: str
    cover_image: Optional[str] = None
    owner_id: str
    created_at: datetime
    updated_at: datetime
    songs: List[SongResponse] = []
    total_play_count: Optional[int] = 0  # Total play count of all songs in playlist
    
    class Config:
        from_attributes = True

class PlaylistResponseWithOwner(PlaylistResponse):
    owner: Optional[UserResponse] = None
    class Config:
        from_attributes = True

class PlaylistSongAdd(BaseModel):
    song_id: str
    position: Optional[int] = None