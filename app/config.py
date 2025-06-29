import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://streamflow_user:streamfl0w@localhost/streamflow_music")
    
    # Handle Railway's PostgreSQL SSL requirements
    @property
    def database_url_with_ssl(self):
        """Get database URL with SSL configuration for Railway"""
        if self.database_url.startswith("postgres://"):
            # Railway uses postgres:// but SQLAlchemy expects postgresql://
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)
        
        # Add SSL mode for Railway
        if "railway" in self.database_url.lower() or "DATABASE_URL" in os.environ:
            if "?" not in self.database_url:
                self.database_url += "?sslmode=require"
            elif "sslmode=" not in self.database_url:
                self.database_url += "&sslmode=require"
        
        return self.database_url
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size: int = 50000000  # 50MB
    allowed_extensions: List[str] = ["mp3", "wav", "flac", "m4a"]
    
    # Server
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))
    
    # Optional: Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()