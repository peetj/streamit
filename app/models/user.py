from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    role = Column(String, default="user")  # 'user' or 'admin'
    
    # Relationships
    uploaded_songs = relationship("Song", back_populates="uploader")
    playlists = relationship("Playlist", back_populates="owner")