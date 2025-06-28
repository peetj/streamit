from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import uuid

# Association table for liked songs
liked_songs_table = Table(
    "liked_songs",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    Column("song_id", String, ForeignKey("songs.id"), primary_key=True)
)

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
    play_count = Column(Integer, default=0)  # Track number of times song has been played
    uploaded_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    uploader = relationship("User", back_populates="uploaded_songs")
    playlist_songs = relationship("PlaylistSong", back_populates="song")
    liked_by = relationship("User", secondary=liked_songs_table, back_populates="liked_songs")
    listening_sessions = relationship("ListeningSession", back_populates="song")

class ListeningSession(Base):
    __tablename__ = "listening_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    song_id = Column(String, ForeignKey("songs.id"), nullable=False)
    playlist_id = Column(String, ForeignKey("playlists.id"))  # Optional, for tracking playlist listening
    duration_seconds = Column(Float, nullable=False)  # How long the song was actually listened to
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="listening_sessions")
    song = relationship("Song", back_populates="listening_sessions")
    playlist = relationship("Playlist", back_populates="listening_sessions")