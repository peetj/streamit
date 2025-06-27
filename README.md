# StreamFlow - Music Streaming App

A modern music streaming application built with FastAPI, React, and PostgreSQL.

## Features

- 🎵 Music upload and streaming
- 📱 Modern React frontend with TypeScript
- 🔐 JWT authentication
- 📋 Playlist management
- 🖼️ Real image search for playlist covers (Unsplash API)
- 🎨 Beautiful, responsive UI
- 🎧 Full audio player with controls

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL
- FFmpeg (for audio processing)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streamit
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database and JWT settings
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb streamflow
   
   # Run migrations
   alembic upgrade head
   ```

5. **Start the backend**
   ```bash
   python run.py
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Set up API keys**

   **Unsplash API Key (for playlist cover images):**
   - Go to [Unsplash Developers](https://unsplash.com/developers)
   - Create an account and register your application
   - Get your free API key
   - Add it to `client/.env.local`:
     ```
     VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
     ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```

## API Keys Setup

### Unsplash API Key

The app uses Unsplash API for real image search when creating playlist covers. To set this up:

1. **Get a free API key:**
   - Visit [https://unsplash.com/developers](https://unsplash.com/developers)
   - Sign up for a free account
   - Click "New Application"
   - Fill in the form:
     - Application name: "StreamFlow"
     - Description: "Music streaming app with playlist cover image search"
     - What are you building?: "A music streaming application that allows users to search for playlist cover images"
     - Will your app be commercial?: "No" (for development)

2. **Add the key to your environment:**
   ```bash
   # In client/.env.local
   VITE_UNSPLASH_ACCESS_KEY=your_actual_api_key_here
   ```

3. **Restart the frontend** after adding the key

**Note:** If no API key is provided, the app will fall back to public image search, but results may be less reliable.

## Usage

### Quick Start

1. **Start all services:**
   ```bash
   python scripts/start_all.py
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin interface: http://localhost:8080

3. **Create a test user:**
   ```bash
   python create_test_user.py
   ```

4. **Upload some test songs:**
   ```bash
   python add_test_songs.py
   ```

### Admin Interface

Access the admin interface at http://localhost:8080 for:
- Song upload and management
- User management
- Database cleanup
- Testing tools

## Development

### Project Structure

```
streamit/
├── app/                    # FastAPI backend
│   ├── api/               # API routes
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom hooks
├── admin/                 # Admin interface
└── scripts/               # Utility scripts
```

### Available Scripts

- `python scripts/start_all.py` - Start all services
- `python scripts/start_backend.py` - Start backend only
- `python scripts/start_frontend.py` - Start frontend only
- `python scripts/start_admin.py` - Start admin interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.