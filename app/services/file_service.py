import os
import shutil
import uuid
import logging
from fastapi import UploadFile, HTTPException
from ..config import settings

logger = logging.getLogger(__name__)

class FileService:
    @staticmethod
    def is_valid_audio_file(filename: str) -> bool:
        if not filename:
            return False
        
        extension = filename.split('.')[-1].lower()
        return extension in settings.allowed_extensions
    
    @staticmethod
    async def save_uploaded_file(file: UploadFile, user_id: str) -> str:
        try:
            # Create user directory
            user_dir = os.path.join(settings.upload_dir, "audio", user_id)
            logger.info("Attempting to create directory: %s", user_dir)

            try:
                os.makedirs(user_dir, exist_ok=True)
                logger.info("Directory created/verified: %s", user_dir)
            except PermissionError as e:
                logger.error("Permission error creating directory: %s", e)
                # Fallback: try to use a simpler path structure
                user_dir = os.path.join(settings.upload_dir, "audio")
                logger.info("Falling back to simple directory: %s", user_dir)
                try:
                    os.makedirs(user_dir, exist_ok=True)
                    logger.info("Fallback directory created: %s", user_dir)
                except PermissionError as e2:
                    logger.error("Fallback directory also failed: %s", e2)
                    raise HTTPException(
                        status_code=500,
                        detail="File system permission error. Cannot create upload directories."
                    )
            except Exception as e:
                logger.error("Unexpected error creating directory: %s", e)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create upload directory: {str(e)}"
                )
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(user_dir, unique_filename)
            
            logger.info("Saving file to: %s", file_path)

            # Save file
            try:
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                logger.info("File saved successfully: %s", file_path)
            except PermissionError as e:
                logger.error("Permission error saving file: %s", e)
                raise HTTPException(
                    status_code=500,
                    detail="File system permission error. Cannot write uploaded file."
                )
            except Exception as e:
                logger.error("Error saving file: %s", e)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save uploaded file: {str(e)}"
                )
            
            return file_path
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error("Unexpected error in save_uploaded_file: %s", e)
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error during file upload: {str(e)}"
            )
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False
    
    @staticmethod
    def create_directory(path: str):
        try:
            os.makedirs(path, exist_ok=True)
            logger.info("Directory created/verified: %s", path)
        except PermissionError as e:
            logger.error("Permission error creating directory %s: %s", path, e)
            raise HTTPException(
                status_code=500,
                detail=f"File system permission error creating directory: {path}"
            )
        except Exception as e:
            logger.error("Error creating directory %s: %s", path, e)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create directory {path}: {str(e)}"
            )