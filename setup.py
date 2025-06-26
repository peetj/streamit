#!/usr/bin/env python3
"""
Setup script for StreamFlow backend
"""
import os
import subprocess
import sys
from pathlib import Path

def create_env_file():
    """Create .env file from example if it doesn't exist"""
    if not os.path.exists('.env'):
        if os.path.exists('env.example'):
            print("Creating .env file from env.example...")
            with open('env.example', 'r') as example:
                with open('.env', 'w') as env:
                    env.write(example.read())
            print("✅ .env file created. Please edit it with your database credentials.")
        else:
            print("❌ env.example not found. Please create a .env file manually.")
            return False
    else:
        print("✅ .env file already exists.")
    return True

def create_upload_dirs():
    """Create upload directories"""
    dirs = ['uploads/audio', 'uploads/artwork']
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {dir_path}")

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import sqlalchemy
        import psycopg2
        import pydantic
        print("✅ All required dependencies are installed.")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def run_migrations():
    """Run database migrations"""
    try:
        print("Running database migrations...")
        subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)
        print("✅ Database migrations completed.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}")
        print("Please check your database connection and .env file.")
        return False

def main():
    print("🚀 StreamFlow Backend Setup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        return
    
    # Create .env file
    if not create_env_file():
        return
    
    # Create upload directories
    create_upload_dirs()
    
    # Run migrations
    print("\n📝 Note: Before running migrations, please:")
    print("1. Edit .env file with your database credentials")
    print("2. Ensure PostgreSQL is running")
    print("3. Create the database: createdb streamflow_music")
    
    response = input("\nReady to run migrations? (y/n): ")
    if response.lower() == 'y':
        run_migrations()
    
    print("\n🎉 Setup complete!")
    print("To start the server, run: python run.py")

if __name__ == "__main__":
    main() 