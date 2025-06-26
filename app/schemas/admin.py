from pydantic import BaseModel
from typing import List, Optional


class CleanupRequest(BaseModel):
    """Request model for cleanup operations."""
    mode: str  # 'dry-run' or 'full'
    dry_run: bool = True


class CleanupResponse(BaseModel):
    """Response model for cleanup operations."""
    duplicates_removed: int = 0
    orphaned_audio_removed: int = 0
    orphaned_artwork_removed: int = 0
    space_saved: int = 0  # in bytes
    duplicate_details: List[dict] = []
    orphaned_files: List[str] = [] 