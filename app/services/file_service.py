import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
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
        try:
            # Create user directory
            user_dir = os.path.join(settings.upload_dir, "audio", user_id)
            print(f"📁 Attempting to create directory: {user_dir}")
            
            try:
                os.makedirs(user_dir, exist_ok=True)
                print(f"✅ Directory created/verified: {user_dir}")
            except PermissionError as e:
                print(f"❌ Permission error creating directory: {e}")
                # Fallback: try to use a simpler path structure
                user_dir = os.path.join(settings.upload_dir, "audio")
                print(f"🔄 Falling back to simple directory: {user_dir}")
                try:
                    os.makedirs(user_dir, exist_ok=True)
                    print(f"✅ Fallback directory created: {user_dir}")
                except PermissionError as e2:
                    print(f"❌ Fallback directory also failed: {e2}")
                    raise HTTPException(
                        status_code=500, 
                        detail="File system permission error. Cannot create upload directories."
                    )
            except Exception as e:
                print(f"❌ Unexpected error creating directory: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to create upload directory: {str(e)}"
                )
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(user_dir, unique_filename)
            
            print(f"📁 Saving file to: {file_path}")
            
            # Save file
            try:
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                print(f"✅ File saved successfully: {file_path}")
            except PermissionError as e:
                print(f"❌ Permission error saving file: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail="File system permission error. Cannot write uploaded file."
                )
            except Exception as e:
                print(f"❌ Error saving file: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to save uploaded file: {str(e)}"
                )
            
            return file_path
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            print(f"❌ Unexpected error in save_uploaded_file: {e}")
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
            print(f"✅ Directory created/verified: {path}")
        except PermissionError as e:
            print(f"❌ Permission error creating directory {path}: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"File system permission error creating directory: {path}"
            )
        except Exception as e:
            print(f"❌ Error creating directory {path}: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to create directory {path}: {str(e)}"
            )