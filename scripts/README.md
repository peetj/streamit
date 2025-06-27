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

## Troubleshooting

- If a service fails to start, check the console output for error messages
- Make sure all dependencies are installed
- Ensure ports 8000, 8080, and 5173 are not already in use
- For Windows users, the orchestration script uses the 'spawn' multiprocessing method for compatibility 