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

   **Image Search APIs (choose one or both):**
   
   **Option 1: Unsplash API (Primary - Higher Quality)**
   - Go to [Unsplash Developers](https://unsplash.com/developers)
   - Create an account and register your application
   - Get your free API key (may take 5-10 days for approval)
   - Add it to `client/.env.local`:
     ```
     VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
     ```

   **Option 2: Flickr API (Backup - Faster Approval)**
   - Go to [Flickr API](https://www.flickr.com/services/api/)
   - Create an account and get your API key (usually instant approval)
   - Add it to `client/.env.local`:
     ```
     VITE_FLICKR_API_KEY=your_flickr_api_key_here
     ```

   **Note:** You can use both APIs - the app will try Unsplash first, then Flickr as backup.

   **Stock Images Fallback:** If no API keys are configured, the app will use built-in stock images for playlist covers.

4. **Start the frontend**
   ```bash
   npm run dev
   ```

## API Keys Setup

### Image Search APIs

The app uses image search APIs for playlist cover images. You can use either or both APIs:

#### Option 1: Unsplash API (Primary - Higher Quality)

1. **Get a free API key:**
   - Visit [https://unsplash.com/developers](https://unsplash.com/developers)
   - Sign up for a free account
   - Click "New Application"
   - Fill in the form:
     - Application name: "StreamFlow"
     - Description: "Music streaming app with playlist cover image search"
     - What are you building?: "A music streaming application that allows users to search for playlist cover images"
     - Will your app be commercial?: "No" (for development)
   - **Note:** Approval may take 5-10 days

2. **Add the key to your environment:**
   ```bash
   # In client/.env.local
   VITE_UNSPLASH_ACCESS_KEY=your_actual_api_key_here
   ```

#### Option 2: Flickr API (Backup - Faster Approval)

1. **Get a free API key:**
   - Visit [https://www.flickr.com/services/api/](https://www.flickr.com/services/api/)
   - Sign up for a free account
   - Click "Get an API key"
   - Fill in the form (usually instant approval)

2. **Add the key to your environment:**
   ```bash
   # In client/.env.local
   VITE_FLICKR_API_KEY=your_actual_api_key_here
   ```

#### Using Both APIs

You can use both APIs for maximum reliability:
- The app will try **Unsplash first** (higher quality images)
- If Unsplash fails or has no results, it will try **Flickr**
- If both fail, it falls back to **stock images**

#### Stock Images Fallback

If no API keys are provided, the app will use built-in stock images as fallback:
- **16 curated images** across 4 categories: Music, Nature, Abstract, and Urban
- **Automatic search matching** - the app tries to find relevant images based on playlist name
- **Random selection** if no matches are found
- **No external dependencies** - works offline and doesn't require API keys

The stock images are placeholder images that you can replace with real photos later by updating the files in `client/public/stock-images/`.

## Usage

### Quick Start

1. **Start all services:**
   ```bash
   python scripts/start_all.py
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173 test user: ("test@streamflow.com" / "{g<poL98iiKSB4c(")
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