# StreamFlow Railway Deployment Guide

This guide will help you deploy StreamFlow to Railway for the hackathon.

## 🚀 Quick Deployment Steps

### 1. **Sign up for Railway**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub account
- Get $5/month free credit

### 2. **Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your StreamFlow repository
- **Choose your repository**: Railway will show a list of your GitHub repos - select your `streamit` repository
- **Auto-detection**: Railway should automatically detect it's a Python app
- **Build process**: Railway will start building your application using the configuration files we created
- **Initial deployment**: It will deploy the backend service automatically

**What to expect during this step:**
- Real-time build logs will appear
- Railway will install dependencies from `requirements.txt`
- It will use our `railway.json`, `Procfile`, and `runtime.txt` configuration
- The build process typically takes 2-5 minutes

### 3. **Add PostgreSQL Database**
- Click "New Service" → "Database" → "PostgreSQL"
- Railway will automatically create the database
- Note the connection details (we'll use them later)

### 4. **Deploy Backend Service**
- Click "New Service" → "GitHub Repo"
- Select your StreamFlow repository
- Railway will auto-detect it's a Python app

### 5. **Configure Environment Variables**
In your backend service, add these environment variables:

```bash
# Database (Railway will provide these)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50000000
ALLOWED_EXTENSIONS=["mp3", "wav", "flac", "m4a"]

# Server Configuration
HOST=0.0.0.0
PORT=$PORT
```

### 6. **Automatic Production Setup**
After deployment, Railway will automatically:
- ✅ Run database migrations
- ✅ Create admin user (admin@streamflow.com / admin123)
- ✅ Create test user (test@streamflow.com / test123)
- ✅ Verify database connection

**No manual setup required!** The `scripts/deployment/setup_production.py` script handles everything.

### 7. **Deploy Frontend (Optional)**
- Create another service for the frontend
- Build command: `cd client && npm install && npm run build`
- Serve static files from `client/dist`

## 🔧 Configuration Files

Railway will use these files automatically:
- `railway.json` - Deployment configuration with post-deploy setup
- `Procfile` - Process definition
- `runtime.txt` - Python version
- `requirements.txt` - Python dependencies
- `scripts/deployment/setup_production.py` - Production setup script

## 🌐 Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `streamflow.app`)
4. Railway provides free SSL certificates

## 📊 Monitoring

Railway provides:
- Real-time logs
- Performance metrics
- Automatic restarts
- Health checks

## 💰 Cost Estimation

- **Backend Service**: ~$5/month
- **PostgreSQL Database**: ~$5/month
- **Frontend Service**: ~$2/month
- **Total**: ~$12/month

## ⚠️ Persistent Volume Warning

### Railway
Railway services have **ephemeral filesystems** — uploaded audio files in `uploads/` are **lost on every redeploy or restart**. This means user-uploaded music will disappear. For production use, you must either:
- Mount a Railway persistent volume on the `uploads/` path (available in Railway dashboard under "Volumes"), or
- Switch to object storage (S3-compatible) for the uploads directory.

Until a persistent volume is attached, treat the uploads directory as temporary.

### Fly.io
The `fly.toml` mounts a persistent volume at `/app/uploads` (`streamflow_data`). Create it before first deploy:
```bash
fly volumes create streamflow_data --size 10
```
Fly volumes are zone-specific — if you scale to multiple regions you'll need a volume in each region.

### Docker (self-hosted)
Mount a host directory or named volume for uploads:
```bash
docker run -v /data/streamflow/uploads:/streamflow/uploads ...
# or with docker-compose:
volumes:
  - streamflow_uploads:/streamflow/uploads
```

## 🗄️ Backup and Restore

### Database backup (PostgreSQL)
```bash
# Backup
pg_dump $DATABASE_URL > streamflow_backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < streamflow_backup_YYYYMMDD.sql
```

On Railway:
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

On Fly.io:
```bash
fly ssh console -C "pg_dump \$DATABASE_URL" > backup.sql
```

### Uploads backup
```bash
# Tar the uploads directory
tar czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Restore
tar xzf uploads_backup_YYYYMMDD.tar.gz
```

Schedule backups via cron or your platform's scheduled tasks. Store backups off-platform (e.g. S3 or Backblaze B2).

## 🚨 Important Notes

1. **File Storage**: Attach a persistent volume before uploading files in production — see above.
2. **Database**: Railway PostgreSQL is persistent and reliable.
3. **Environment**: All environment variables must be set in Railway dashboard.
4. **Logs**: Check Railway logs for any deployment issues.
5. **Default Credentials**: Change the admin password immediately after first login.

## 🔍 Troubleshooting

### Common Issues:
- **Build fails**: Check `requirements.txt` and Python version
- **Database connection**: Verify `DATABASE_URL` format
- **Port issues**: Railway uses `$PORT` environment variable
- **File uploads**: Ensure `uploads` directory exists
- **Setup script fails**: Check Railway logs for error details

### Debug Commands:
```bash
# Check logs
railway logs

# Check environment
railway variables

# Restart service
railway service restart

# Run setup manually (if needed)
railway run python scripts/deployment/setup_production.py
```

## ✅ Success Checklist

- [ ] Backend service deployed and healthy
- [ ] Database connected and migrations run
- [ ] Environment variables configured
- [ ] Admin user created (admin@streamflow.com)
- [ ] Test user created (test@streamflow.com)
- [ ] Frontend accessible (if deployed)
- [ ] Custom domain working (optional)
- [ ] File uploads working
- [ ] User registration/login working

## 🎯 Hackathon Ready!

Once deployed, your StreamFlow will be:
- Publicly accessible
- Database-backed with sample users
- Ready for demo
- Scalable for judges to test

**Default Login Credentials:**
- **Admin**: admin@streamflow.com / admin123
- **Test User**: test@streamflow.com / test123

**Estimated deployment time: 30-60 minutes** 