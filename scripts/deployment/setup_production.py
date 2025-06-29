#!/usr/bin/env python3
"""
Production Setup Script for StreamFlow
This script handles initial setup for production deployment (Railway, etc.)
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# Add the project root to Python path for Railway environment
# In Railway, the script runs from the project root directory
script_dir = Path(__file__).parent
project_root = script_dir.parent.parent  # Go up from scripts/deployment to project root

# Add both the project root and app directory to Python path
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "app"))

# Debug: Print paths to help troubleshoot
print(f"🔍 Script directory: {script_dir}")
print(f"🔍 Project root: {project_root}")
print(f"🔍 Python path: {sys.path[:3]}...")

try:
    from app.database import engine, SessionLocal
    from app.models.user import User
    from app.utils.security import get_password_hash
    from app.config import settings
    print("✅ Successfully imported app modules")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print(f"🔍 Available directories in project root:")
    if project_root.exists():
        for item in project_root.iterdir():
            print(f"   - {item.name}")
    sys.exit(1)

def run_migrations():
    """Run database migrations"""
    print("🔄 Running database migrations...")
    try:
        result = subprocess.run(["alembic", "upgrade", "head"], 
                              capture_output=True, text=True, check=True)
        print("✅ Migrations completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Migration failed: {e.stderr}")
        # Check if it's a duplicate column error (tables already exist)
        if "DuplicateColumn" in e.stderr or "already exists" in e.stderr:
            print("ℹ️ Tables already exist, skipping migrations")
            return True
        print(f"❌ Migration failed with error: {e.stderr}")
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
    """Verify database connection with retry logic"""
    print("🔍 Verifying database connection...")
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            # Test connection using proper SQLAlchemy syntax
            with engine.connect() as conn:
                from sqlalchemy import text
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
                print("✅ Database connection successful")
                return True
        except Exception as e:
            print(f"❌ Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                print("❌ All database connection attempts failed")
                return False

def main():
    """Main setup function"""
    print("🚀 StreamFlow Production Setup")
    print("=" * 40)
    
    # Print current working directory and Python path for debugging
    print(f"📁 Current working directory: {os.getcwd()}")
    print(f"🐍 Python path: {sys.path[:3]}...")  # Show first 3 entries
    
    # Print database URL for debugging (without password)
    db_url = settings.database_url_with_ssl
    if "@" in db_url:
        # Mask password in URL for security
        parts = db_url.split("@")
        if ":" in parts[0]:
            protocol_user = parts[0].split(":")
            if len(protocol_user) >= 3:
                masked_url = f"{protocol_user[0]}:{protocol_user[1]}:***@{parts[1]}"
                print(f"🔗 Database URL: {masked_url}")
    
    # Verify database connection
    if not verify_database_connection():
        print("❌ Cannot proceed without database connection")
        print("💡 Please check your DATABASE_URL environment variable in Railway")
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