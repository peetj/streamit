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

**No manual setup required!** The `scripts/setup_production.py` script handles everything.

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
- `scripts/setup_production.py` - Production setup script

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

## 🚨 Important Notes

1. **File Storage**: Railway has ephemeral storage. For production, use external storage (AWS S3, etc.)
2. **Database**: Railway PostgreSQL is persistent and reliable
3. **Environment**: All environment variables must be set in Railway dashboard
4. **Logs**: Check Railway logs for any deployment issues
5. **Default Users**: Change default passwords after first login!

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
railway run python scripts/setup_production.py
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