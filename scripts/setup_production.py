#!/usr/bin/env python3
"""
Production Setup Script for StreamFlow
This script handles initial setup for production deployment (Railway, etc.)
"""

import os
import sys
import subprocess
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from app.database import engine, SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash
from app.config import settings

def run_migrations():
    """Run database migrations"""
    print("🔄 Running database migrations...")
    try:
        result = subprocess.run(["alembic", "upgrade", "head"], 
                              capture_output=True, text=True, check=True)
        print("✅ Migrations completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e.stderr}")
        return False

def create_admin_user():
    """Create the initial admin user"""
    print("👤 Creating admin user...")
    
    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing_user = db.query(User).filter(User.email == "admin@streamflow.com").first()
        if existing_user:
            print("✅ Admin user already exists")
            return True
        
        # Create admin user
        admin_user = User(
            email="admin@streamflow.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),  # Change this in production!
            is_active=True,
            role="admin"
        )
        
        db.add(admin_user)
        db.commit()
        print("✅ Admin user created successfully")
        print("📧 Email: admin@streamflow.com")
        print("🔑 Password: admin123")
        print("⚠️  IMPORTANT: Change this password after first login!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_test_user():
    """Create a test user for demo purposes"""
    print("👤 Creating test user...")
    
    db = SessionLocal()
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@streamflow.com").first()
        if existing_user:
            print("✅ Test user already exists")
            return True
        
        # Create test user
        test_user = User(
            email="test@streamflow.com",
            username="testuser",
            hashed_password=get_password_hash("test123"),  # Change this in production!
            is_active=True,
            role="user"
        )
        
        db.add(test_user)
        db.commit()
        print("✅ Test user created successfully")
        print("📧 Email: test@streamflow.com")
        print("🔑 Password: test123")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create test user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_database_connection():
    """Verify database connection"""
    print("🔍 Verifying database connection...")
    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 StreamFlow Production Setup")
    print("=" * 40)
    
    # Verify database connection
    if not verify_database_connection():
        print("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        print("❌ Cannot proceed without successful migrations")
        sys.exit(1)
    
    # Create admin user
    if not create_admin_user():
        print("❌ Failed to create admin user")
        sys.exit(1)
    
    # Create test user
    if not create_test_user():
        print("❌ Failed to create test user")
        sys.exit(1)
    
    print("\n🎉 Production setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Access your deployed StreamFlow")
    print("2. Login with admin@streamflow.com / admin123")
    print("3. Change the admin password immediately")
    print("4. Upload some music files")
    print("5. Test all features")

if __name__ == "__main__":
    main() 