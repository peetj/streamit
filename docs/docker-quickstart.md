# Docker Quickstart Guide

Get StreamFlow running with Docker in minutes! This guide covers local development, testing, and deployment.

## 🚀 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) (for deployment)

## 📦 Local Development

### 1. Clone and Navigate
```bash
cd streamit
```

### 2. Start Development Environment
```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will:
- Build React frontend with hot reloading
- Start FastAPI backend with live code changes
- Start PostgreSQL database
- Start Redis cache
- Mount source code for development
- Expose frontend on `http://localhost:3000`
- Expose backend on `http://localhost:8000`

### 3. Access Your App
- **Frontend**: http://localhost:3000 (React with hot reload)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Admin Panel**: http://localhost:8000/admin

## 🧪 Testing the Build

Before deploying, test your Docker build:

```bash
./scripts/deployment/test_docker_build.sh
```

This script:
- Builds the Docker image
- Runs a test container
- Checks health endpoints
- Cleans up automatically

## 🚀 Deploy to Fly.io

### 1. Login to Fly.io
```bash
flyctl auth login
```

### 2. Set Up Database
```bash
# Create PostgreSQL database
flyctl postgres create --name streamflow-db --region iad

# Attach to your app
flyctl postgres attach streamflow-db --app streamflow-app
```

### 3. Configure Secrets
```bash
# Set JWT secret (generate a secure one)
flyctl secrets set SECRET_KEY="your-super-secret-key-here"

# Optional: Set Redis URL if you have external Redis
flyctl secrets set REDIS_URL="redis://username:password@host:port"
```

### 4. Deploy
```bash
./scripts/deployment/deploy_to_fly.sh
```

Or deploy manually:
```bash
flyctl deploy
```

### 5. Access Your Deployed App
- **Production URL**: https://streamflow-app.fly.dev
- **API Docs**: https://streamflow-app.fly.dev/docs

## 🔧 Configuration

### App Name
Change the app name in `fly.toml`:
```toml
app = "your-app-name"
```

### Region
Change the region in `fly.toml`:
```toml
primary_region = "iad"  # Options: iad, ord, lax, ams, etc.
```

### Resources
Modify resources in `fly.toml`:
```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

## 📊 Monitoring

```bash
# View logs
flyctl logs

# Check status
flyctl status

# Monitor resources
flyctl dashboard

# SSH into container
flyctl ssh console
```

## 🛠️ Common Commands

### Local Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

### Production
```bash
# Deploy
flyctl deploy

# Restart app
flyctl restart

# Scale up
flyctl scale count 2

# Scale down
flyctl scale count 1

# Check secrets
flyctl secrets list

# Set new secret
flyctl secrets set KEY="value"
```

## 🔍 Troubleshooting

### Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t streamflow .
```

### Database Issues
```bash
# Check database connection
flyctl ssh console
# Then: python -c "from app.database import engine; print(engine.execute('SELECT 1').scalar())"
```

### File Upload Issues
```bash
# Check volume
flyctl volumes list

# Create volume if missing
flyctl volumes create streamflow_data --size 10 --region iad
```

### Health Check Failures
```bash
# Check logs
flyctl logs

# Test health endpoint
curl https://your-app.fly.dev/health
```

## 💰 Cost Optimization

- **Auto-stop**: Machines stop when not in use (saves money)
- **Shared CPU**: Use shared instances for development
- **Min machines**: Set `min_machines_running = 0` for dev

## 📚 Next Steps

- Read the full [Deployment Guide](../README_DEPLOYMENT.md)
- Set up CI/CD with GitHub Actions
- Configure custom domains
- Set up monitoring and alerts

## 🧪 Testing Your Application

After starting the development environment, test each component to ensure everything is working correctly.

### 1. Test Frontend (React)
```bash
# Open in browser
http://localhost:3000
```

**What to check**:
- ✅ Page loads without errors
- ✅ React app renders correctly
- ✅ Hot reloading works (edit a file and see changes)
- ✅ No console errors in browser dev tools

### 2. Test Backend API
```bash
# Health check
curl http://localhost:8000/health

# API documentation
curl http://localhost:8000/docs
```

**What to check**:
- ✅ Health endpoint returns `{"status": "healthy"}`
- ✅ API docs load at http://localhost:8000/docs
- ✅ No error messages in backend logs

### 3. Test Database Connection
```bash
# Check if database is accessible
docker-compose -f docker-compose.dev.yml exec backend python -c "
from app.database import engine
print('Database connection:', engine.execute('SELECT 1').scalar())
"
```

**What to check**:
- ✅ Returns `Database connection: 1`
- ✅ No connection errors

### 4. Test Redis Connection
```bash
# Check if Redis is accessible
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

**What to check**:
- ✅ Returns `PONG`
- ✅ No connection errors

### 5. Test File Uploads
```bash
# Check if uploads directory is writable
docker-compose -f docker-compose.dev.yml exec backend ls -la /streamflow/uploads/
```

**What to check**:
- ✅ Directory exists and is writable
- ✅ Shows `audio/`, `artwork/`, `profile/` subdirectories

### 6. Test Admin Panel
```bash
# Open in browser
http://localhost:8000/admin
```

**What to check**:
- ✅ Admin interface loads
- ✅ No 404 errors

### 7. Test API Endpoints
```bash
# Test authentication endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'

# Test songs endpoint
curl http://localhost:8000/api/songs
```

**What to check**:
- ✅ Endpoints respond (even if with errors for invalid data)
- ✅ No 500 server errors
- ✅ Proper JSON responses

### 8. Test Frontend-Backend Communication
1. Open http://localhost:3000 in browser
2. Open browser dev tools (F12)
3. Try to log in or access a feature
4. Check Network tab for API calls

**What to check**:
- ✅ API calls are made to http://localhost:8000
- ✅ No CORS errors
- ✅ Responses are received correctly

## 🔧 Troubleshooting Common Issues

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose -f docker-compose.dev.yml logs frontend

# Restart frontend service
docker-compose -f docker-compose.dev.yml restart frontend
```

### Backend Not Responding
```bash
# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend

# Check if backend is running
docker-compose -f docker-compose.dev.yml ps
```

### Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.dev.yml logs db

# Restart database
docker-compose -f docker-compose.dev.yml restart db
```

### Hot Reloading Not Working
```bash
# Check if volumes are mounted correctly
docker-compose -f docker-compose.dev.yml exec frontend ls -la /streamflow/client/src/

# Restart with force recreate
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

## ✅ Success Checklist

When everything is working correctly, you should have:
- ✅ React frontend running at http://localhost:3000 with hot reloading
- ✅ FastAPI backend running at http://localhost:8000
- ✅ PostgreSQL database accessible
- ✅ Redis cache accessible
- ✅ File uploads working
- ✅ API documentation available at http://localhost:8000/docs
- ✅ Admin panel accessible at http://localhost:8000/admin
- ✅ No error messages in any service logs

## 🆘 Need Help?

- [Fly.io Documentation](https://fly.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [StreamFlow Issues](https://github.com/your-repo/issues) 