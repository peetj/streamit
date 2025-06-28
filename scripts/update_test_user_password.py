#!/usr/bin/env python3
"""
Script to update the test user's password in the database.
Run this script to change the password for test@streamflow.com
"""

import sys
import os
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def update_test_user_password(new_password: str):
    """Update the password for the test user"""
    db = SessionLocal()
    try:
        # Find the test user
        user = db.query(User).filter(User.email == "test@streamflow.com").first()
        
        if not user:
            print("❌ Test user not found in database!")
            print("Make sure you have run the database setup and created the test user.")
            return False
        
        # Update the password
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        
        print(f"✅ Successfully updated password for test@streamflow.com")
        print(f"New password: {new_password}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating password: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python update_test_user_password.py <new_password>")
        print("Example: python update_test_user_password.py MyNewSecurePassword123!")
        sys.exit(1)
    
    new_password = sys.argv[1]
    
    if len(new_password) < 8:
        print("❌ Password must be at least 8 characters long")
        sys.exit(1)
    
    print("🔄 Updating test user password...")
    success = update_test_user_password(new_password)
    
    if success:
        print("\n📝 Don't forget to update the password in your frontend code:")
        print("   - client/src/components/AuthPage.tsx (line with password: 'testpass123')")
        print("   - Any other places where you hardcoded the test password")
    else:
        sys.exit(1) 