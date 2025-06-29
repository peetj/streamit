# StreamFlow - Getting Started Guide

Welcome to StreamFlow! This guide will walk you through setting up the complete development environment for this music streaming application.

## 🎯 What You'll Build

StreamFlow is a modern music streaming platform with:
- **Backend**: FastAPI with PostgreSQL database
- **Frontend**: React with Vite and TypeScript
- **Features**: User authentication, music upload, playlist management, drag-and-drop reordering, listening statistics, and more

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Notes |
|----------|---------|-------|
| **Python** | 3.8+ | Required for FastAPI backend |
| **Node.js** | 18+ | Required for React frontend |
| **PostgreSQL** | 13+ | Database server |
| **Git** | Latest | For cloning the repository |

### System-Specific Installation

#### Windows
- **Python**: Download from [python.org](https://python.org) or use [Chocolatey](https://chocolatey.org): `choco install python`
- **Node.js**: Download from [nodejs.org](https://nodejs.org) or use Chocolatey: `choco install nodejs`
- **PostgreSQL**: Download from [postgresql.org](https://postgresql.org) or use Chocolatey: `choco install postgresql`

#### macOS
- **Python**: Use [Homebrew](https://brew.sh): `brew install python`
- **Node.js**: Use Homebrew: `brew install node`
- **PostgreSQL**: Use Homebrew: `brew install postgresql`

#### Linux (Ubuntu/Debian)
```bash
# Python
sudo apt update
sudo apt install python3 python3-pip

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib
```

## 🚀 Step 1: Clone and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/peetj/streamit.git
   cd streamit
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

## 🗄️ Step 2: PostgreSQL Setup

### Install PostgreSQL

Follow the installation instructions for your operating system above.

### Create Database and User

1. **Start PostgreSQL service:**
   ```bash
   # Windows (if installed as service)
   # PostgreSQL should start automatically
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Access PostgreSQL as superuser:**
   ```bash
   # Windows (if using default installation)
   psql -U postgres
   
   # macOS
   psql postgres
   
   # Linux
   sudo -u postgres psql
   ```

3. **Create database and user:**
   ```sql
   CREATE DATABASE streamflow_music;
   CREATE USER streamflow_user WITH PASSWORD 'streamfl0w';
   GRANT ALL PRIVILEGES ON DATABASE streamflow_music TO streamflow_user;
   \q
   ```

### ⚠️ PostgreSQL Authentication Issues

**If you encounter authentication errors**, you may need to temporarily modify PostgreSQL's authentication method:

1. **Find your PostgreSQL configuration:**
   ```bash
   # Windows (typical location)
   C:\Program Files\PostgreSQL\[version]\data\pg_hba.conf
   
   # macOS (if installed via Homebrew)
   /usr/local/var/postgres/pg_hba.conf
   
   # Linux
   /etc/postgresql/[version]/main/pg_hba.conf
   ```

2. **Temporarily change authentication method:**
   ```bash
   # Find this line:
   local   all             all                                     scram-sha-256
   
   # Change it to:
   local   all             all                                     trust
   ```

3. **Restart PostgreSQL:**
   ```bash
   # Windows
   # Restart PostgreSQL service from Services
   
   # macOS
   brew services restart postgresql
   
   # Linux
   sudo systemctl restart postgresql
   ```

4. **Create your database and user** (see steps above)

5. **Change authentication back to secure method:**
   ```bash
   # Change back to:
   local   all             all                                     scram-sha-256
   ```

6. **Restart PostgreSQL again**

## ⚙️ Step 3: Environment Configuration

1. **Create environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file** with your database credentials:
   ```bash
   # Database Configuration
   DATABASE_URL=postgresql://streamflow_user:streamfl0w@localhost/streamflow_music
   
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
   PORT=8000
   ```

3. **Create frontend environment file:**
   ```bash
   cd client
   cp env.example .env.local
   cd ..
   ```

4. **Edit `client/.env.local`:**
   ```bash
   # Backend API Configuration
   VITE_BACKEND_URL=http://localhost:8000
   
   # Optional: Image Search API Keys (for playlist covers)
   VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   VITE_FLICKR_API_KEY=your_flickr_api_key_here
   
   # Optional: LastFM API Key (for Artist of the Day)
   VITE_LASTFM_API_KEY=your_lastfm_api_key_here
   ```

## 🗃️ Step 4: Database Setup

1. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

2. **Create test user:**
   ```bash
   python scripts/admin/generate_secure_password.py
   # Use the generated password in the next step
   
   python scripts/admin/update_test_user_password.py "your_generated_password"
   ```

## 🚀 Step 5: Start the Application

### Option A: Start All Services (Recommended)
```bash
python scripts/startup/start_all.py
```

### Option B: Start Services Individually

1. **Start Backend (Terminal 1):**
   ```bash
   python scripts/startup/start_backend.py
   ```

2. **Start Frontend (Terminal 2):**
   ```bash
   python scripts/startup/start_frontend.py
   ```

3. **Start Admin Interface (Terminal 3, Optional):**
   ```bash
   python scripts/startup/start_admin.py
   ```

## 🧪 Step 6: Verify Everything Works

### Test Backend
1. **Check API documentation:** http://localhost:8000/docs
2. **Test health endpoint:** http://localhost:8000/
3. **Verify database connection:** Check backend logs for any database errors

### Test Frontend
1. **Open application:** http://localhost:5173
2. **Check for console errors:** Open browser developer tools (F12)

### Test Admin Interface (Optional)
1. **Open admin panel:** http://localhost:8080
2. **Verify database operations:** Try creating a test user or uploading a song

## 🔐 Step 7: Login and Test

1. **Login with test user:**
   - **Email:** `test@streamflow.com`
   - **Password:** (The password you generated in Step 4)

2. **Test features:**
   - Create a playlist
   - Upload a music file
   - Test drag-and-drop reordering
   - Check listening statistics

## 📁 Project Structure

```
streamit/
├── app/                    # FastAPI backend
│   ├── api/               # API routes
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── client/                # React frontend
│   ├── src/               # Source code
│   └── public/            # Static assets
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── uploads/               # File uploads
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
- **Error:** `connection refused`
  - **Solution:** Ensure PostgreSQL is running
- **Error:** `authentication failed`
  - **Solution:** Check pg_hba.conf configuration (see PostgreSQL setup above)

#### Port Already in Use
- **Error:** `Address already in use`
  - **Solution:** Kill existing processes or change ports in `.env`

#### Frontend Build Errors
- **Error:** `Module not found`
  - **Solution:** Run `npm install` in the `client/` directory

#### Migration Errors
- **Error:** `Target database is not up to date`
  - **Solution:** Run `alembic upgrade head`

### Getting Help

1. **Check the logs** for specific error messages
2. **Verify all services are running** on the correct ports
3. **Ensure environment variables are set correctly**
4. **Check database connectivity** with `psql -U streamflow_user -d streamflow_music`

## 🎉 Next Steps

Once you have StreamFlow running:

1. **Explore the features:**
   - Upload your own music
   - Create playlists
   - Test the drag-and-drop functionality
   - Check listening statistics

2. **Customize the application:**
   - Modify the UI theme
   - Add new features
   - Configure external APIs

3. **Learn the codebase:**
   - Read through the API documentation
   - Explore the React components
   - Understand the database schema

## 📚 Additional Resources

- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **React Documentation:** https://react.dev/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Vite Documentation:** https://vitejs.dev/

---

**Happy coding! 🎵** 