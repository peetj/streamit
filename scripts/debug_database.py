#!/usr/bin/env python3
"""
Database Connection Debug Script for Railway
This script helps debug database connection issues in Railway deployment
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from app.config import settings

def debug_environment():
    """Debug environment variables"""
    print("🔍 Environment Variables Debug")
    print("=" * 40)
    
    # Check for Railway-specific variables
    railway_vars = [
        "DATABASE_URL",
        "PORT",
        "RAILWAY_ENVIRONMENT",
        "RAILWAY_PROJECT_ID",
        "RAILWAY_SERVICE_ID"
    ]
    
    for var in railway_vars:
        value = os.getenv(var)
        if value:
            if "password" in var.lower() or "secret" in var.lower():
                print(f"✅ {var}: [HIDDEN]")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: Not set")
    
    print("\n🔗 Database URL Analysis")
    print("=" * 40)
    
    # Analyze the database URL
    db_url = settings.database_url
    ssl_url = settings.database_url_with_ssl
    
    print(f"Original DATABASE_URL: {db_url}")
    print(f"SSL-configured URL: {ssl_url}")
    
    if db_url != ssl_url:
        print("✅ SSL configuration applied")
    else:
        print("ℹ️  No SSL configuration needed")
    
    # Check if it's a Railway URL
    if "railway" in db_url.lower():
        print("✅ Detected Railway database URL")
    elif "postgres" in db_url.lower():
        print("ℹ️  PostgreSQL URL detected")
    else:
        print("⚠️  Unknown database URL format")

def test_connection():
    """Test database connection"""
    print("\n🔌 Database Connection Test")
    print("=" * 40)
    
    try:
        from app.database import engine
        
        print("🔄 Attempting to connect...")
        with engine.connect() as conn:
            result = conn.execute("SELECT version()")
            version = result.fetchone()[0]
            print("✅ Connection successful!")
            print(f"📊 PostgreSQL version: {version}")
            return True
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        return False

def main():
    """Main debug function"""
    print("🐛 StreamFlow Database Debug Tool")
    print("=" * 50)
    
    debug_environment()
    
    if test_connection():
        print("\n🎉 Database connection is working!")
    else:
        print("\n❌ Database connection failed!")
        print("\n💡 Troubleshooting tips:")
        print("1. Check if DATABASE_URL is set in Railway")
        print("2. Verify the database service is running")
        print("3. Check if SSL is required")
        print("4. Ensure the database credentials are correct")

if __name__ == "__main__":
    main() 