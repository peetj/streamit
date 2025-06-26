from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import uuid

class Song(Base):
    __tablename__ = "songs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    album = Column(String)
    duration = Column(Float)  # in seconds
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    format = Column(String)  # mp3, wav, flac
    bitrate = Column(Integer)
    sample_rate = Column(Integer)
    genre = Column(String)
    year = Column(Integer)
    album_art_path = Column(String)
    uploaded_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    uploader = relationship("User", back_populates="uploaded_songs")
    playlist_songs = relationship("PlaylistSong", back_populates="song")