# StreamFlow Development Scripts

This directory contains scripts to manage different parts of the StreamFlow application.

## Individual Service Scripts

### 🚀 Backend Server
```bash
python scripts/start_backend.py
```
- Starts the FastAPI backend server
- Runs on: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 🔧 Admin Page Server
```bash
python scripts/start_admin.py
```
- Starts a simple HTTP server for the admin pages
- Runs on: http://localhost:8080
- Admin Page: http://localhost:8080/admin.html
- Test Backend: http://localhost:8080/test_backend.html

### 🎨 Frontend Development Server
```bash
python scripts/start_frontend.py
```
- Starts the React frontend development server
- Runs on: http://localhost:5173
- Automatically installs dependencies if needed
- Includes cache-busting and security improvements

### 🧹 Cache Clearing
```bash
python scripts/clear_cache.py
```
- Clears Vite cache, dist folder, and Python cache
- Use this when experiencing caching issues
- Recommended after making configuration changes

### 🔄 Chrome Cache Troubleshooting
```bash
python scripts/clear_chrome_cache.py
```
- Chrome-specific cache clearing instructions
- Provides step-by-step solutions for Chrome caching issues
- Can open Chrome cache settings automatically

## 🎵 Orchestration Script

### Start All Services
```bash
python scripts/start_all.py
```
This script starts all three services simultaneously:
- Backend API server (port 8000)
- Admin page server (port 8080)
- React frontend (port 5173)

**Features:**
- Starts services in the correct order
- Provides clear status messages
- Graceful shutdown with Ctrl+C
- Process monitoring (detects if any service crashes)

## Quick Start

1. **Start everything at once:**
   ```bash
   python scripts/start_all.py
   ```

2. **Or start services individually:**
   ```bash
   # Terminal 1 - Backend
   python scripts/start_backend.py
   
   # Terminal 2 - Admin
   python scripts/start_admin.py
   
   # Terminal 3 - Frontend
   python scripts/start_frontend.py
   ```

## Access Points

Once all services are running:

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin Interface**: http://localhost:8080/admin.html
- **Frontend App**: http://localhost:5173

## 🔒 Security & Cache Improvements

### Security Fixes
- **Source maps disabled** in development to prevent file path exposure
- **Cache headers** configured to prevent aggressive caching
- **File paths removed** from build output

### Cache Management
- **Cache-busting meta tags** added to HTML
- **Vite configuration** optimized for development
- **Cache clearing script** available for troubleshooting
- **Chrome-specific troubleshooting** for aggressive caching

### Troubleshooting Cache Issues
If you experience caching problems:

1. **Clear all caches:**
   ```bash
   python scripts/clear_cache.py
   ```

2. **Chrome-specific issues (most common):**
   ```bash
   python scripts/clear_chrome_cache.py
   ```

3. **Hard refresh browser:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

4. **Disable browser cache:**
   - Open Developer Tools → Network → Check "Disable cache"
   - **Important**: Keep DevTools open in Chrome

5. **Use Incognito mode** for testing

6. **Restart development servers** after clearing cache

### 🚨 Chrome-Specific Issues
Chrome is known for aggressive caching. If you see HTML instead of JavaScript:

1. **Immediate fix**: Open DevTools (F12) → Network → Check "Disable cache" → Keep DevTools open
2. **Hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. **Incognito mode**: `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
4. **Clear Chrome cache**: Go to `chrome://settings/clearBrowserData`
5. **Use Edge for development** (less aggressive caching)

## Troubleshooting

- If a service fails to start, check the console output for error messages
- Make sure all dependencies are installed
- Ensure ports 8000, 8080, and 5173 are not already in use
- For Windows users, the orchestration script uses the 'spawn' multiprocessing method for compatibility
- If experiencing cache issues, run `python scripts/clear_cache.py` and restart services
- **For Chrome cache issues**, run `python scripts/clear_chrome_cache.py` for specific instructions 