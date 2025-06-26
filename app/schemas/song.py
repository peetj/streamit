from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SongBase(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None

class SongCreate(SongBase):
    pass

class SongUpload(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None

class SongResponse(SongBase):
    id: str
    duration: Optional[float] = None
    file_size: Optional[int] = None
    format: Optional[str] = None
    bitrate: Optional[int] = None
    sample_rate: Optional[int] = None
    album_art_path: Optional[str] = None
    uploaded_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True