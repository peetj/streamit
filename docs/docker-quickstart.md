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

### 2. Start with Docker Compose
```bash
docker-compose up --build
```

This will:
- Build the application
- Start PostgreSQL database
- Start Redis cache
- Mount uploads directory
- Expose the app on `http://localhost:8000`

### 3. Access Your App
- **Frontend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

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
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
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

## 🆘 Need Help?

- [Fly.io Documentation](https://fly.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [StreamFlow Issues](https://github.com/your-repo/issues) 