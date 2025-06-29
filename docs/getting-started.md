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

### Optional Software

| Software | Version | Notes |
|----------|---------|-------|
| **FFmpeg** | Latest | For creating test audio files |

**FFmpeg Usage**: FFmpeg is only used in the optional test data creation script (`scripts/data-management/fix_song_metadata.py`) to generate sample audio files with proper metadata. This is useful for testing playlist functionality without uploading your own music files. FFmpeg must be installed and available on your system PATH.

**When you might need FFmpeg:**
- You want to test the application with sample audio files
- You're running the test data setup scripts
- You want to create audio files with embedded metadata for testing

**If you don't install FFmpeg:** You can still use StreamFlow normally by uploading your own music files through the web interface.

### System-Specific Installation

#### Windows
- **Python**: Download from [python.org](https://python.org) or use [Chocolatey](https://chocolatey.org): `choco install python`
- **Node.js**: Download from [nodejs.org](https://nodejs.org) or use Chocolatey: `choco install nodejs`
- **PostgreSQL**: Download from [postgresql.org](https://postgresql.org) or use Chocolatey: `choco install postgresql`
- **FFmpeg (Optional)**: Download from [ffmpeg.org](https://ffmpeg.org) or use Chocolatey: `choco install ffmpeg`

#### macOS
- **Python**: Use [Homebrew](https://brew.sh): `brew install python`
- **Node.js**: Use Homebrew: `brew install node`
- **PostgreSQL**: Use Homebrew: `brew install postgresql`
- **FFmpeg (Optional)**: Use Homebrew: `brew install ffmpeg`

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

# FFmpeg (Optional)
sudo apt install ffmpeg
```

## 🚀 Step 1: Clone and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/peetj/streamit.git
   cd streamit
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Node.js dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

**Note:** Always activate your virtual environment before running Python commands. You'll know it's activated when you see `(venv)` at the beginning of your command prompt.

## 🗄️ Step 2: PostgreSQL Setup

### Install PostgreSQL

**Choose your operating system below for specific installation instructions:**

#### Windows
1. **Download PostgreSQL:**
   - Go to [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Download the latest version (13 or higher)
   - Run the installer as Administrator

2. **During installation:**
   - Choose your installation directory
   - Set a password for the `postgres` superuser (remember this!)
   - Keep the default port (5432)
   - Install all components (PostgreSQL Server, pgAdmin, Stack Builder)

3. **Alternative: Use Chocolatey (if you have it):**
   ```bash
   choco install postgresql
   ```

#### macOS
1. **Using Homebrew (Recommended):**
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

2. **Alternative: Download installer:**
   - Go to [PostgreSQL Downloads](https://www.postgresql.org/download/macosx/)
   - Download and run the installer

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Linux (CentOS/RHEL/Fedora)
```bash
# Install PostgreSQL
sudo dnf install postgresql postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database and User

1. **Start PostgreSQL service** (if not already running):
   ```bash
   # Windows (if installed as service)
   # Method 1: Using Services app (Recommended - easier)
   # Press Win+R, type "services.msc", press Enter
   # Look for any service starting with "postgresql" and start it
   
   # Method 2: Using Command Prompt (Advanced users)
   # Open Command Prompt as Administrator, then run:
   # 'sc' is the Service Control command - it manages Windows services
   sc query postgresql*
   # This will show all PostgreSQL services regardless of version
   
   # Start PostgreSQL service (replace X with your version number from the query above)
   sc start postgresql-x64-X
   
   # Set PostgreSQL to start automatically on boot
   sc config postgresql-x64-X start= auto
   
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

   **What is the JWT SECRET_KEY?**
   
   The JWT SECRET_KEY is used to **sign and verify authentication tokens**. Here's why it's important:
   
   - **Token Creation**: When you log in, the server creates a JWT token using this secret key
   - **Token Verification**: Every time you make an API request, the server verifies the token using this same key
   - **Security**: Only someone with this secret key can create valid tokens for your application
   - **User Sessions**: This is how the app knows you're logged in and who you are
   
   **Why do you need to set it?**
   
   - **Default is insecure**: The default value `"change-this-in-production"` is not secure
   - **Unique per installation**: Each StreamFlow installation should have its own secret key
   - **Prevents token forgery**: Without a proper secret key, anyone could create fake login tokens
   
   **How to generate a secure key:**
   ```bash
   # Option 1: Use the provided script
   python scripts/admin/generate_secure_password.py
   
   # Option 2: Generate a random string (at least 32 characters)
   # You can use any secure random string generator
   ```
   
   **Example of a secure SECRET_KEY:**
   ```
   SECRET_KEY=my-super-secret-jwt-key-2024-streamflow-app-xyz123
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

## ��️ Step 4: Start the Backend

**Make sure you're in the streamit root folder before starting the backend.**

```bash
# Make sure your virtual environment is activated (see Step 1.2 above)
python scripts/startup/start_backend.py
```

**What happens when you start the backend:**
- The FastAPI server starts and connects to your PostgreSQL database
- SQLAlchemy's `create_all()` function creates the base tables (users, songs, playlists, etc.)
- The application is now ready to accept requests

## 🗃️ Step 5: Database Migrations

### What is Alembic?

**Alembic** is a database migration tool for SQLAlchemy. Think of it as "version control for your database schema." Here's why it's important:

- **Database Changes**: When you modify your database models (like adding new tables or columns), Alembic creates migration files that describe these changes
- **Version Control**: Each migration is numbered and tracked, so you can upgrade or rollback your database to any version
- **Team Collaboration**: Multiple developers can apply the same database changes consistently
- **Production Safety**: Ensures your production database schema matches your code

**Learn More:** [Alembic Documentation](https://alembic.sqlalchemy.org/)

### Run Database Migrations

**Important:** You must start the backend server first (Step 4) before running migrations. This is because:
- The backend server calls `Base.metadata.create_all()` which creates the base tables (users, songs, playlists, etc.)
- Alembic migrations then add additional columns and tables (like listening sessions, liked songs, etc.)
- Without the base tables, migrations will fail

1. **Run database migrations:**
   ```bash
   # Make sure your virtual environment is activated (see Step 1.2 above)
   alembic upgrade head
   ```

   **What this does:**
   - Reads all migration files in `alembic/versions/`
   - Applies any migrations that haven't been run yet
   - Adds new columns and tables (like listening sessions, liked songs, etc.)
   - Updates your database schema to match the current code

2. **Create test user:**
   ```bash
   # Generate a secure password
   python scripts/admin/generate_secure_password.py
   # Use the generated password in the next step
   
   python scripts/admin/update_test_user_password.py "your_generated_password"
   ```

## 🚀 Step 6: Start Frontend and Admin Services

**Now that all database tables exist, you can start the frontend and admin services.**

### Option A: Start Services Individually (Recommended for First-Time Setup)
**Start services individually so you can see the output from each server and troubleshoot any issues.**

1. **Start Frontend (Terminal 2):**
   ```bash
   # Make sure your virtual environment is activated (see Step 1.2 above)
   python scripts/startup/start_frontend.py
   ```

   **What happens when you start the frontend:**
   - Vite development server starts and builds the React application
   - TypeScript compilation and hot module replacement are enabled
   - The frontend connects to the backend API at the configured URL

2. **Start Admin Interface (Terminal 3, Optional):**
   ```bash
   # Make sure your virtual environment is activated (see Step 1.2 above)
   python scripts/startup/start_admin.py
   ```

   **What happens when you start the admin interface:**
   - A simple web interface starts for database management
   - Provides tools for user management, song uploads, and system administration
   - Useful for testing and debugging database operations

### Option B: Start All Services (For Experienced Users)
```bash
# Make sure your virtual environment is activated (see Step 1.2 above)
python scripts/startup/start_all.py
```

## 🧪 Step 7: Verify Everything Works

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

## 🔐 Step 8: Login and Test

1. **Login with test user:**
   - **Email:** `test@streamflow.com`
   - **Password:** (The password you generated in Step 5)

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
  - **Solution:** Make sure you've started the backend server first (Step 4) to create the base tables, then run `alembic upgrade head` (Step 5)
- **Error:** `Table does not exist`
  - **Solution:** Start the backend server (Step 4) to create base tables via `create_all()`, then run migrations (Step 5)

#### Virtual Environment Issues
- **Error:** `ModuleNotFoundError` or `command not found`
  - **Solution:** Make sure your virtual environment is activated. You should see `(venv)` in your terminal prompt
  - **Activate virtual environment** (see Step 1.2 above):
    ```bash
    # Windows
    venv\Scripts\activate
    
    # macOS/Linux
    source venv/bin/activate
    ```
- **Error:** `pip: command not found`
  - **Solution:** Ensure Python and pip are installed, then create and activate a virtual environment (see Step 1.2 above)

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