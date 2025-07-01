# StreamFlow Deployment Guide - Fly.io

This guide will help you deploy your StreamFlow application to Fly.io using Docker.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
3. **Docker**: Ensure Docker is installed and running
4. **Database**: You'll need a PostgreSQL database (can be provided by Fly.io or external)

## Quick Deployment

### 1. Login to Fly.io
```bash
flyctl auth login
```

### 2. Set Environment Variables
You'll need to set these secrets in Fly.io:

```bash
# Database URL (replace with your actual database URL)
flyctl secrets set DATABASE_URL="postgresql://username:password@host:port/database"

# Secret key for JWT tokens (generate a secure one)
flyctl secrets set SECRET_KEY="your-super-secret-key-here"

# Redis URL (optional, for caching)
flyctl secrets set REDIS_URL="redis://username:password@host:port"
```

### 3. Deploy
```bash
# Run the deployment script
./scripts/deployment/deploy_to_fly.sh

# Or deploy manually
flyctl deploy
```

## Manual Deployment Steps

### 1. Create the App
```bash
flyctl apps create streamflow-app --org personal
```

### 2. Create Volume for File Storage
```bash
flyctl volumes create streamflow_data --size 10 --region iad
```

### 3. Set Secrets
```bash
flyctl secrets set DATABASE_URL="your-database-url"
flyctl secrets set SECRET_KEY="your-secret-key"
```

### 4. Deploy
```bash
flyctl deploy
```

## Configuration

### Fly.toml
The `fly.toml` file contains your deployment configuration:

- **App Name**: `streamflow-app` (change this to your preferred name)
- **Region**: `iad` (Washington DC) - change to your preferred region
- **Resources**: 1 CPU, 1GB RAM
- **Port**: 8000
- **Health Check**: `/health` endpoint

### Dockerfile
The multi-stage Dockerfile:
1. Builds the React frontend
2. Sets up the Python backend
3. Combines both into a single container

## Database Setup

### Option 1: Fly.io PostgreSQL (Recommended)
```bash
# Create a PostgreSQL database
flyctl postgres create --name streamflow-db --region iad

# Attach it to your app
flyctl postgres attach streamflow-db --app streamflow-app
```

### Option 2: External Database
Use any PostgreSQL provider (Railway, Supabase, etc.) and set the `DATABASE_URL` secret.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT secret key |
| `REDIS_URL` | No | Redis connection string for caching |
| `PORT` | No | Port (default: 8000) |

## File Storage

The application uses Fly.io volumes for persistent file storage:
- Audio files
- Album artwork
- Profile pictures

The volume is mounted at `/app/uploads` in the container.

## Monitoring and Logs

```bash
# View logs
flyctl logs

# Monitor the app
flyctl status

# SSH into the container (for debugging)
flyctl ssh console
```

## Scaling

```bash
# Scale to multiple instances
flyctl scale count 3

# Scale with specific resources
flyctl scale vm shared-cpu-2x --memory 2048
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `requirements.txt`
   - Ensure the Dockerfile is in the root directory

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is set correctly
   - Check if the database is accessible from Fly.io

3. **File Upload Issues**
   - Ensure the volume is created and mounted
   - Check file permissions

4. **Health Check Failures**
   - Verify the `/health` endpoint is working
   - Check application logs

### Debug Commands

```bash
# Check app status
flyctl status

# View recent logs
flyctl logs

# Check secrets
flyctl secrets list

# Check volumes
flyctl volumes list

# Restart the app
flyctl restart
```

## Local Development with Docker

You can test the Docker setup locally:

```bash
# Build and run with docker-compose
docker-compose up --build

# Or build manually
docker build -t streamflow .
docker run -p 8000:8000 streamflow
```

## Security Considerations

1. **Secrets**: Never commit secrets to version control
2. **HTTPS**: Fly.io automatically provides HTTPS
3. **Database**: Use SSL connections for production databases
4. **File Uploads**: Validate file types and sizes

## Cost Optimization

- Use `auto_stop_machines = true` to stop machines when not in use
- Set `min_machines_running = 0` for development
- Use shared CPU instances for cost savings

## Support

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- [StreamFlow Issues](https://github.com/your-repo/issues) 