#!/usr/bin/env python3
"""
Test script to verify profile image upload functionality
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_image.jpg"

def create_test_image():
    """Create a simple test image if it doesn't exist"""
    if not os.path.exists(TEST_IMAGE_PATH):
        # Create a simple 1x1 pixel JPEG
        with open(TEST_IMAGE_PATH, "wb") as f:
            # Minimal JPEG header
            f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9')
        print(f"Created test image: {TEST_IMAGE_PATH}")

def test_profile_upload():
    """Test the profile image upload functionality"""
    
    print("🧪 Testing Profile Image Upload Functionality")
    print("=" * 50)
    
    # Step 1: Create test image
    create_test_image()
    
    # Step 2: Login to get token
    print("\n1. Logging in...")
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        login_response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
        
        token_data = login_response.json()
        token = token_data["access_token"]
        print("✅ Login successful")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 3: Upload profile image
    print("\n2. Uploading profile image...")
    
    try:
        with open(TEST_IMAGE_PATH, "rb") as f:
            files = {"image": f}
            headers = {"Authorization": f"Bearer {token}"}
            
            upload_response = requests.post(
                f"{BACKEND_URL}/api/upload/profile-image",
                files=files,
                headers=headers
            )
        
        if upload_response.status_code != 200:
            print(f"❌ Upload failed: {upload_response.status_code}")
            print(f"Response: {upload_response.text}")
            return False
        
        upload_data = upload_response.json()
        filename = upload_data.get("filename")
        print(f"✅ Upload successful: {filename}")
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False
    
    # Step 4: Verify user profile updated
    print("\n3. Verifying profile update...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = requests.get(f"{BACKEND_URL}/api/auth/me", headers=headers)
        
        if profile_response.status_code != 200:
            print(f"❌ Profile fetch failed: {profile_response.status_code}")
            return False
        
        profile_data = profile_response.json()
        avatar_url = profile_data.get("avatar")
        
        if avatar_url and filename in avatar_url:
            print(f"✅ Profile updated successfully")
            print(f"Avatar URL: {avatar_url}")
        else:
            print(f"❌ Profile not updated properly")
            print(f"Expected filename: {filename}")
            print(f"Actual avatar: {avatar_url}")
            return False
        
    except Exception as e:
        print(f"❌ Profile verification error: {e}")
        return False
    
    # Step 5: Test image serving
    print("\n4. Testing image serving...")
    
    try:
        image_url = f"{BACKEND_URL}/uploads/profile/{filename}"
        image_response = requests.get(image_url)
        
        if image_response.status_code == 200:
            print(f"✅ Image serving works: {len(image_response.content)} bytes")
        else:
            print(f"❌ Image serving failed: {image_response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Image serving error: {e}")
        return False
    
    print("\n🎉 All tests passed! Profile image upload is working correctly.")
    return True

if __name__ == "__main__":
    success = test_profile_upload()
    if not success:
        print("\n❌ Some tests failed. Check the backend logs for more details.")
        exit(1) 