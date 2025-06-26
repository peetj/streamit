from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, UserLogin, Token
from ..services.auth_service import get_current_user
from ..utils.security import verify_password, get_password_hash, create_access_token

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    **Features:**
    - **Email Validation**: Ensures unique email addresses
    - **Username Validation**: Ensures unique usernames
    - **Password Hashing**: Securely hashes passwords
    - **Account Creation**: Creates user profile
    
    **Examples:**
    ```json
    {
        "username": "johndoe",
        "email": "john@example.com",
        "password": "securepassword123"
    }
    ```
    
    **Response:**
    - User profile (without password)
    - Account creation timestamp
    """
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=getattr(user, 'role', 'user')
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and get access token.
    
    **Features:**
    - **JWT Token**: Returns Bearer token for API access
    - **Password Verification**: Securely verifies password
    - **30-minute Expiry**: Token expires after 30 minutes
    - **Email-based Login**: Use email address to login
    
    **Examples:**
    ```json
    {
        "email": "john@example.com",
        "password": "securepassword123"
    }
    ```
    
    **Response:**
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer"
    }
    ```
    
    **Usage:**
    - Include token in Authorization header: `Bearer <token>`
    - Token required for all protected endpoints
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user profile information.
    
    **Features:**
    - **Profile Data**: Returns user's profile information
    - **Authentication Required**: Must be logged in
    - **Real-time Data**: Always returns current user data
    
    **Examples:**
    - Get profile: `GET /api/auth/me`
    - Requires Authorization header: `Bearer <your_token>`
    
    **Response:**
    ```json
    {
        "id": "user-uuid",
        "username": "johndoe",
        "email": "john@example.com",
        "avatar": null,
        "is_active": true,
        "created_at": "2024-01-01T12:00:00Z"
    }
    ```
    """
    return current_user