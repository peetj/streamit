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
        # Debug: Print which URL we're using
        print(f"🔗 Original DATABASE_URL: {self.database_url}")
        print(f"🔗 Environment DATABASE_URL: {os.getenv('DATABASE_URL', 'Not set')}")
        
        if self.database_url.startswith("postgres://"):
            # Railway uses postgres:// but SQLAlchemy expects postgresql://
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)
            print(f"🔗 Converted to postgresql://: {self.database_url}")
        
        # Add SSL mode for Railway
        if "railway" in self.database_url.lower() or "DATABASE_URL" in os.environ:
            if "?" not in self.database_url:
                self.database_url += "?sslmode=require"
            elif "sslmode=" not in self.database_url:
                self.database_url += "&sslmode=require"
            print(f"🔗 Added SSL mode: {self.database_url}")
        
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
    port: int = 8000
    
    @property
    def port_with_fallback(self):
        """Get port with proper fallback handling"""
        try:
            port_env = os.getenv("PORT")
            if port_env:
                return int(port_env)
            return self.port
        except (ValueError, TypeError):
            print(f"⚠️ Invalid PORT value: {os.getenv('PORT')}, using default: {self.port}")
            return self.port
    
    # Optional: Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()