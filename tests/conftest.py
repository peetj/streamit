"""
Test configuration and common fixtures for StreamFlow backend tests.
This file provides reusable test utilities and database setup/teardown.
"""
import os
import sys
import pytest
import tempfile
import shutil
from pathlib import Path
from typing import Generator, Optional

# Add the app directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.song import Song
from app.utils.security import get_password_hash
from app.config import settings


class TestDataManager:
    """Manages test data creation and cleanup"""
    
    def __init__(self):
        self.test_users = []
        self.test_songs = []
        self.temp_dirs = []
    
    def create_test_user(self, username: str = "testuser", email: str = "test@streamflow.com", 
                        password: str = "testpass123") -> User:
        """Create a test user in the database"""
        db = SessionLocal()
        
        try:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                self.test_users.append(existing_user)
                return existing_user
            
            # Create new test user
            test_user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash(password)
            )
            
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            
            self.test_users.append(test_user)
            return test_user
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def create_user_directories(self, user_id: str) -> tuple[Path, Path]:
        """Create upload directories for a user"""
        user_audio_dir = Path(settings.upload_dir) / "audio" / user_id
        user_artwork_dir = Path(settings.upload_dir) / "artwork" / user_id
        
        user_audio_dir.mkdir(parents=True, exist_ok=True)
        user_artwork_dir.mkdir(parents=True, exist_ok=True)
        
        return user_audio_dir, user_artwork_dir
    
    def cleanup_user_data(self, user_id: str):
        """Clean up all data for a specific user"""
        db = SessionLocal()
        
        try:
            # Delete associated songs first
            songs = db.query(Song).filter(Song.uploaded_by == user_id).all()
            for song in songs:
                # Delete song files
                if song.file_path and os.path.exists(song.file_path):
                    try:
                        os.remove(song.file_path)
                    except Exception:
                        pass
                
                # Delete album art
                if song.album_art_path and os.path.exists(song.album_art_path):
                    try:
                        os.remove(song.album_art_path)
                    except Exception:
                        pass
            
            # Delete song records
            db.query(Song).filter(Song.uploaded_by == user_id).delete()
            
            # Delete user directories
            user_audio_dir = Path(settings.upload_dir) / "audio" / user_id
            user_artwork_dir = Path(settings.upload_dir) / "artwork" / user_id
            
            if user_audio_dir.exists():
                shutil.rmtree(user_audio_dir)
            
            if user_artwork_dir.exists():
                shutil.rmtree(user_artwork_dir)
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def cleanup_all(self):
        """Clean up all test data"""
        for user in self.test_users:
            try:
                self.cleanup_user_data(user.id)
                
                # Delete user
                db = SessionLocal()
                try:
                    db.delete(user)
                    db.commit()
                except Exception:
                    db.rollback()
                finally:
                    db.close()
            except Exception:
                pass
        
        # Clean up temp directories
        for temp_dir in self.temp_dirs:
            try:
                shutil.rmtree(temp_dir)
            except Exception:
                pass
        
        self.test_users.clear()
        self.test_songs.clear()
        self.temp_dirs.clear()
    
    def create_test_song(self, user_id: str, file_path: str, **kwargs) -> Song:
        """Create a test song record"""
        db = SessionLocal()
        
        try:
            song_data = {
                "title": kwargs.get("title", "Test Song"),
                "artist": kwargs.get("artist", "Test Artist"),
                "album": kwargs.get("album", "Test Album"),
                "genre": kwargs.get("genre", "Test"),
                "year": kwargs.get("year", 2024),
                "duration": kwargs.get("duration", 180),
                "file_path": file_path,
                "file_size": kwargs.get("file_size", 1024),
                "format": kwargs.get("format", "wav"),
                "bitrate": kwargs.get("bitrate", 320),
                "sample_rate": kwargs.get("sample_rate", 44100),
                "album_art_path": kwargs.get("album_art_path"),
                "uploaded_by": user_id
            }
            
            db_song = Song(**song_data)
            db.add(db_song)
            db.commit()
            db.refresh(db_song)
            
            self.test_songs.append(db_song)
            return db_song
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()


# Global test data manager
test_data_manager = TestDataManager()


@pytest.fixture(scope="session")
def db_session():
    """Create database session for tests"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    yield SessionLocal()
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db_session) -> User:
    """Create a test user for tests"""
    user = test_data_manager.create_test_user()
    yield user
    # Cleanup is handled by test_data_manager.cleanup_all()


@pytest.fixture
def test_user_dirs(test_user) -> tuple[Path, Path]:
    """Create upload directories for test user"""
    return test_data_manager.create_user_directories(test_user.id)


@pytest.fixture
def sample_audio_file(test_user_dirs) -> Path:
    """Create a sample audio file for testing"""
    audio_dir, _ = test_user_dirs
    
    # Create a dummy audio file
    sample_file = audio_dir / "sample.wav"
    with open(sample_file, 'wb') as f:
        # Write some dummy audio data (just a header)
        f.write(b'RIFF    WAVEfmt ')
    
    return sample_file


@pytest.fixture(autouse=True)
def cleanup_after_test():
    """Automatically clean up after each test"""
    yield
    test_data_manager.cleanup_all()


def get_test_user_credentials() -> dict:
    """Get standard test user credentials"""
    return {
        "email": "test@streamflow.com",
        "password": "testpass123",
        "username": "testuser"
    } 