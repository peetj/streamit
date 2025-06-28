#!/usr/bin/env python3
"""
Chrome-specific cache clearing and troubleshooting for StreamFlow development
"""
import webbrowser
import os
from pathlib import Path

def clear_chrome_cache():
    """Provide Chrome-specific cache clearing instructions"""
    print("🔄 Chrome Cache Troubleshooting for StreamFlow")
    print("=" * 60)
    print()
    
    print("🎯 Chrome is known to be aggressive with caching. Here are the solutions:")
    print()
    
    print("1️⃣ **Immediate Fix - DevTools Method:**")
    print("   • Open Chrome DevTools (F12)")
    print("   • Go to Network tab")
    print("   • ✅ Check 'Disable cache'")
    print("   • ⚠️  Keep DevTools OPEN while testing")
    print("   • 🔄 Refresh the page")
    print()
    
    print("2️⃣ **Hard Refresh (Recommended):**")
    print("   • Windows: Ctrl + Shift + R")
    print("   • Mac: Cmd + Shift + R")
    print("   • Or hold Shift and click refresh button")
    print()
    
    print("3️⃣ **Incognito Mode (Most Reliable):**")
    print("   • Windows: Ctrl + Shift + N")
    print("   • Mac: Cmd + Shift + N")
    print("   • Test in incognito window")
    print()
    
    print("4️⃣ **Clear Chrome Cache:**")
    print("   • Go to: chrome://settings/clearBrowserData")
    print("   • Select 'Cached images and files'")
    print("   • Choose 'All time'")
    print("   • Click 'Clear data'")
    print()
    
    print("5️⃣ **Nuclear Option - Chrome Flags:**")
    print("   • Go to: chrome://flags/")
    print("   • Search for 'cache'")
    print("   • Disable 'Enable HTTP/2 server push'")
    print("   • Restart Chrome")
    print()
    
    print("🔧 **Development Server Settings:**")
    print("   • Vite config updated with aggressive cache headers")
    print("   • HTML file has cache-busting meta tags")
    print("   • Use '--force' flag when starting dev server")
    print()
    
    print("💡 **Pro Tips:**")
    print("   • Use Edge for development (less aggressive caching)")
    print("   • Keep DevTools open with 'Disable cache' checked")
    print("   • Use Incognito mode for testing")
    print("   • Restart Chrome if cache issues persist")
    print()
    
    # Offer to open Chrome settings
    try:
        response = input("🚀 Open Chrome cache settings? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            webbrowser.open('chrome://settings/clearBrowserData')
            print("✅ Opened Chrome cache settings")
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    clear_chrome_cache() 