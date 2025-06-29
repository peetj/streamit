#!/usr/bin/env python3
"""
Shared utilities for StreamFlow scripts
"""
from pathlib import Path

def find_project_root():
    """
    Find the project root by looking for key project files.
    
    Returns:
        Path: The project root directory
        
    Raises:
        FileNotFoundError: If project root cannot be found
    """
    current = Path(__file__).resolve()
    while current.parent != current:  # Stop at filesystem root
        # Look for project root indicators
        if (current / "app" / "main.py").exists() and (current / "client" / "package.json").exists():
            return current
        current = current.parent
    raise FileNotFoundError("Could not find project root (looking for app/main.py and client/package.json)")

def get_project_paths():
    """
    Get common project paths.
    
    Returns:
        dict: Dictionary with project paths
    """
    root = find_project_root()
    return {
        'root': root,
        'app': root / 'app',
        'client': root / 'client',
        'admin': root / 'admin',
        'scripts': root / 'scripts',
        'uploads': root / 'uploads',
    } 