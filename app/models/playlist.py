from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Table
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import uuid

class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String)
    cover_image = Column(String)
    owner_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="playlists")
    playlist_songs = relationship("PlaylistSong", back_populates="playlist", cascade="all, delete-orphan")
    listening_sessions = relationship("ListeningSession", back_populates="playlist")
    
    @property
    def songs(self):
        """Get songs in this playlist, ordered by position"""
        return [ps.song for ps in sorted(self.playlist_songs, key=lambda ps: ps.position)]

class PlaylistSong(Base):
    __tablename__ = "playlist_songs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    playlist_id = Column(String, ForeignKey("playlists.id"))
    song_id = Column(String, ForeignKey("songs.id"))
    position = Column(Integer, nullable=False)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    playlist = relationship("Playlist", back_populates="playlist_songs")
    song = relationship("Song", back_populates="playlist_songs")