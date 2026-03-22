import logging
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
    port: int = 8000
    
    # CORS — comma-separated list of allowed origins, e.g. https://app.example.com
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")

    @property
    def cors_origins_list(self) -> List[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # Optional: Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Function to get port with fallback (outside of the class to avoid validation issues)
def get_port() -> int:
    """Get port with proper fallback handling"""
    try:
        port_env = os.getenv("PORT")
        if port_env:
            return int(port_env)
        return 8000  # Default fallback
    except (ValueError, TypeError):
        logging.getLogger(__name__).warning("Invalid PORT value: %s, using default: 8000", os.getenv('PORT'))
        return 8000