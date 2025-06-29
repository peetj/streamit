import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://streamflow_user:streamfl0w@localhost/streamflow_music"
    
    # JWT
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size: int = 50000000  # 50MB
    allowed_extensions: List[str] = ["mp3", "wav", "flac", "m4a"]
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Optional: Redis
    redis_url: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()