import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from sqlalchemy.orm import Session

router = APIRouter()

# Ensure upload directories exist
UPLOAD_DIR = Path("uploads")
PROFILE_IMAGES_DIR = UPLOAD_DIR / "profile"
PROFILE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/profile-image/")
async def upload_profile_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a profile image for the current user
    """
    # Validate file type
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        )
    
    # Validate file size
    if image.size and image.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 5MB."
        )
    
    try:
        # Generate unique filename
        file_extension = Path(image.filename).suffix if image.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = PROFILE_IMAGES_DIR / unique_filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        # Update user's avatar in database
        current_user.avatar = f"/uploads/profile/{unique_filename}"
        db.commit()
        
        return JSONResponse({
            "success": True,
            "filename": unique_filename,
            "message": "Profile image uploaded successfully"
        })
        
    except Exception as e:
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        ) 