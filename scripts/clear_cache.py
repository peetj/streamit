#!/usr/bin/env python3
"""
Clear various caches for StreamFlow development
"""
import shutil
import os
from pathlib import Path

def clear_cache():
    """Clear various caches that might cause issues during development"""
    project_root = Path(__file__).parent.parent
    client_dir = project_root / "client"
    
    print("🧹 Clearing StreamFlow caches...")
    print("=" * 50)
    
    # Clear Vite cache
    vite_cache = client_dir / "node_modules" / ".vite"
    if vite_cache.exists():
        try:
            shutil.rmtree(vite_cache)
            print("✅ Cleared Vite cache")
        except Exception as e:
            print(f"⚠️ Could not clear Vite cache: {e}")
    
    # Clear dist folder
    dist_folder = client_dir / "dist"
    if dist_folder.exists():
        try:
            shutil.rmtree(dist_folder)
            print("✅ Cleared dist folder")
        except Exception as e:
            print(f"⚠️ Could not clear dist folder: {e}")
    
    # Clear Python cache
    python_cache_dirs = [
        project_root / "__pycache__",
        project_root / "app" / "__pycache__",
        project_root / "tests" / "__pycache__",
    ]
    
    for cache_dir in python_cache_dirs:
        if cache_dir.exists():
            try:
                shutil.rmtree(cache_dir)
                print(f"✅ Cleared Python cache: {cache_dir.name}")
            except Exception as e:
                print(f"⚠️ Could not clear {cache_dir.name}: {e}")
    
    # Clear .pyc files
    for pyc_file in project_root.rglob("*.pyc"):
        try:
            pyc_file.unlink()
            print(f"✅ Removed {pyc_file.name}")
        except Exception as e:
            print(f"⚠️ Could not remove {pyc_file.name}: {e}")
    
    print("\n🎉 Cache clearing complete!")
    print("\n💡 Tips to prevent cache issues:")
    print("1. Use Ctrl+Shift+R (or Cmd+Shift+R on Mac) to hard refresh")
    print("2. Open Developer Tools → Network → check 'Disable cache'")
    print("3. Use Incognito/Private browsing mode for testing")
    print("4. Restart the development servers after clearing cache")

if __name__ == "__main__":
    clear_cache() 