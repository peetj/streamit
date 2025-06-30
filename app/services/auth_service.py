from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from ..database import get_db
from ..models.user import User
from ..config import settings

security = HTTPBearer()


async def get_current_user(token: str = Depends(security), db: Session = Depends(get_db)):
    print(f"🔍 AUTH DEBUG: Attempting to authenticate user")
    print(f"🔍 AUTH DEBUG: Token received: {token.credentials[:20]}..." if token.credentials else "No token")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        print(f"🔍 AUTH DEBUG: JWT decoded successfully, username: {username}")
        if username is None:
            print(f"❌ AUTH DEBUG: No username in JWT payload")
            raise credentials_exception
    except JWTError as e:
        print(f"❌ AUTH DEBUG: JWT decode failed: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        print(f"❌ AUTH DEBUG: User not found in database for username: {username}")
        raise credentials_exception
    
    print(f"✅ AUTH DEBUG: User authenticated successfully - {user.username} (ID: {user.id}, Role: {user.role})")
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    """
    Dependency to ensure the current user has admin role.
    Use this for admin-only endpoints like file uploads and deletions.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Only users with 'admin' role can perform this action."
        )
    
    return current_user