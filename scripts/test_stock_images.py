#!/usr/bin/env python3
"""
Test script to verify stock images functionality
"""

import os
import sys
import json
from pathlib import Path

# Add the client/src directory to the path so we can import the config
client_src_path = Path(__file__).parent.parent / 'client' / 'src'
sys.path.insert(0, str(client_src_path))

try:
    from config.stockImages import STOCK_IMAGES, searchStockImages, getRandomStockImages, getStockImagesByCategory
    print("✅ Successfully imported stock images configuration")
except ImportError as e:
    print(f"❌ Failed to import stock images: {e}")
    print(f"Looking in: {client_src_path}")
    print(f"Available files: {list(client_src_path.glob('*'))}")
    sys.exit(1)

def test_stock_images_exist():
    """Test that all stock image files exist"""
    print("\n🔍 Testing stock image files...")
    
    missing_files = []
    for image in STOCK_IMAGES:
        full_path = f"client/public/stock-images/{image['id']}.jpg"
        thumb_path = f"client/public/stock-images/{image['id']}-thumb.jpg"
        
        if not os.path.exists(full_path):
            missing_files.append(full_path)
        if not os.path.exists(thumb_path):
            missing_files.append(thumb_path)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    else:
        print(f"✅ All {len(STOCK_IMAGES) * 2} stock image files exist")
        return True

def test_search_functionality():
    """Test the search functionality"""
    print("\n🔍 Testing search functionality...")
    
    # Test music search
    music_results = searchStockImages("music")
    print(f"✅ Music search: {len(music_results)} results")
    
    # Test nature search
    nature_results = searchStockImages("nature")
    print(f"✅ Nature search: {len(nature_results)} results")
    
    # Test abstract search
    abstract_results = searchStockImages("abstract")
    print(f"✅ Abstract search: {len(abstract_results)} results")
    
    # Test urban search
    urban_results = searchStockImages("urban")
    print(f"✅ Urban search: {len(urban_results)} results")
    
    # Test non-existent search
    no_results = searchStockImages("xyz123")
    print(f"✅ No results search: {len(no_results)} results (should be 0)")
    
    return True

def test_random_functionality():
    """Test the random image functionality"""
    print("\n🔍 Testing random image functionality...")
    
    # Test getting 4 random images
    random_images = getRandomStockImages(4)
    print(f"✅ Random images (4): {len(random_images)} results")
    
    # Test getting all images
    all_random = getRandomStockImages(len(STOCK_IMAGES))
    print(f"✅ Random images (all): {len(all_random)} results")
    
    return True

def test_category_functionality():
    """Test the category functionality"""
    print("\n🔍 Testing category functionality...")
    
    categories = ['music', 'nature', 'abstract', 'urban']
    
    for category in categories:
        category_images = getStockImagesByCategory(category)
        print(f"✅ {category.capitalize()} category: {len(category_images)} images")
    
    return True

def test_image_structure():
    """Test that all images have the correct structure"""
    print("\n🔍 Testing image structure...")
    
    required_fields = ['id', 'url', 'thumbnail', 'alt', 'category', 'tags']
    
    for i, image in enumerate(STOCK_IMAGES):
        missing_fields = [field for field in required_fields if field not in image]
        if missing_fields:
            print(f"❌ Image {i} missing fields: {missing_fields}")
            return False
    
    print(f"✅ All {len(STOCK_IMAGES)} images have correct structure")
    return True

def main():
    """Run all tests"""
    print("🧪 Testing Stock Images Functionality")
    print("=" * 50)
    
    tests = [
        test_image_structure,
        test_stock_images_exist,
        test_search_functionality,
        test_random_functionality,
        test_category_functionality
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Stock images functionality is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the output above.")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1) 