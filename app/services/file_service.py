import os
import shutil
import uuid
from fastapi import UploadFile
from ..config import settings

class FileService:
    @staticmethod
    def is_valid_audio_file(filename: str) -> bool:
        if not filename:
            return False
        
        extension = filename.split('.')[-1].lower()
        return extension in settings.allowed_extensions
    
    @staticmethod
    async def save_uploaded_file(file: UploadFile, user_id: str) -> str:
        # Create user directory
        user_dir = os.path.join(settings.upload_dir, "audio", user_id)
        os.makedirs(user_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(user_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    
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
        os.makedirs(path, exist_ok=True)