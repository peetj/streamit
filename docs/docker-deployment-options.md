# Docker Deployment Options

StreamFlow supports multiple Docker deployment strategies. Choose the one that best fits your needs.

## 🎯 Deployment Options

### Option 1: Backend Only (Recommended for API-only)
**File**: `Dockerfile` (backend only)

```bash
# Build and run backend only
docker build -t streamflow-backend .
docker run -p 8000:8000 streamflow-backend
```

**What you get**:
- ✅ FastAPI backend with API endpoints
- ✅ Admin panel at `/admin`
- ✅ API documentation at `/docs`
- ✅ Health checks at `/health`
- ✅ File uploads at `/uploads`

**Use case**: When you want to serve the React frontend separately (e.g., from a CDN, Vercel, Netlify)

### Option 2: Separate Frontend & Backend (Recommended for full-stack)
**Files**: `Dockerfile.frontend`, `Dockerfile.backend`, `docker-compose.yml`

```bash
# Run both frontend and backend
docker-compose up --build
```

**What you get**:
- ✅ React frontend at `http://localhost:3000`
- ✅ FastAPI backend at `http://localhost:8000`
- ✅ Nginx proxy handling routing
- ✅ No CORS issues (nginx handles proxying)

**Use case**: Full-stack application with proper separation of concerns

### Option 3: Single Container (Legacy)
**File**: `Dockerfile` (if modified to include frontend)

**Use case**: When you need everything in one container (not recommended)

## 🚀 Quick Start

### Backend Only
```bash
# Build backend
docker build -t streamflow-backend .

# Run with environment variables
docker run -p 8000:8000 \
  -e DATABASE_URL="your-database-url" \
  -e SECRET_KEY="your-secret-key" \
  streamflow-backend
```

### Full Stack (Frontend + Backend)
```bash
# Start all services
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:3000/docs
```

## 📁 File Structure

```
streamit/
├── Dockerfile              # Backend only
├── Dockerfile.backend      # Backend only (alternative)
├── Dockerfile.frontend     # React frontend
├── docker-compose.yml      # Multi-container setup
├── client/
│   ├── nginx.conf         # Nginx configuration
│   └── ...                # React app
├── app/                   # FastAPI backend
└── ...
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key

# Optional
REDIS_URL=redis://host:port
PORT=8000
```

### Nginx Configuration
The `client/nginx.conf` file handles:
- Serving React app from root (`/`)
- Proxying API requests to backend (`/api/*`)
- Proxying uploads (`/uploads/*`)
- Proxying admin panel (`/admin/*`)
- Proxying docs (`/docs`)

## 🎯 Production Deployment

### Fly.io (Backend Only)
```bash
# Use the main Dockerfile for backend-only deployment
flyctl deploy
```

### Fly.io (Full Stack)
You'll need to deploy frontend and backend separately or use a different approach.

### Docker Compose (Production)
```bash
# Build and run in production
docker-compose -f docker-compose.yml up -d
```

## 🔍 Troubleshooting

### Backend Issues
```bash
# Check logs
docker logs <container-name>

# Access container
docker exec -it <container-name> /bin/bash

# Check health
curl http://localhost:8000/health
```

### Frontend Issues
```bash
# Check nginx logs
docker logs <frontend-container-name>

# Check nginx config
docker exec -it <frontend-container-name> nginx -t
```

### Database Issues
```bash
# Check database connection
docker exec -it <backend-container-name> python -c "
from app.database import engine
print(engine.execute('SELECT 1').scalar())
"
```

## 💡 Recommendations

1. **Development**: Use `docker-compose up` for full-stack development
2. **API-only**: Use `Dockerfile` for backend-only deployment
3. **Production**: Consider deploying frontend to CDN (Vercel, Netlify) and backend to Fly.io
4. **Full-stack**: Use separate containers with nginx proxy

## 🔄 Migration

### From Single Container to Multi-Container
1. Stop existing container
2. Run `docker-compose up --build`
3. Update your frontend API calls to use relative paths

### From Multi-Container to Backend Only
1. Deploy frontend separately (Vercel, Netlify, etc.)
2. Update frontend API calls to point to backend URL
3. Deploy backend using `Dockerfile` 