# StreamFlow - Modern Music Streaming Platform

**StreamFlow™** is a trademark of the project maintainers.

StreamFlow is a full-featured music streaming application that combines the power of modern web technologies with an intuitive user experience. Whether you're a music enthusiast looking to organize your collection or a developer interested in building streaming applications, StreamFlow provides a complete solution.

## 🎵 What is StreamFlow?

StreamFlow is a self-hosted music streaming platform that allows you to:

- **Upload and stream your music collection** with support for MP3, WAV, FLAC, and M4A formats
- **Create and manage playlists** with drag-and-drop reordering and custom cover images
- **Track listening statistics** including play counts, listening sessions, and favorite songs
- **Discover new music** through the Artist of the Day feature powered by LastFM
- **Manage your library** with advanced search, filtering, and organization tools
- **Enjoy a modern interface** with responsive design that works on desktop and mobile

### Why Use StreamFlow?

- **Complete Control**: Host your music collection on your own infrastructure
- **Privacy Focused**: Your music and listening data stays on your servers
- **Customizable**: Open-source code allows you to modify and extend functionality
- **Modern Stack**: Built with cutting-edge technologies for performance and maintainability

## ✨ Features

### 🎧 Music Management
- **Multi-format Support**: Upload MP3, WAV, FLAC, and M4A files
- **Automatic Metadata Extraction**: Artist, album, title, and duration detection
- **Bulk Upload**: Upload multiple files at once
- **Audio Streaming**: Efficient streaming with range requests for seeking

### 📋 Playlist System
- **Create Custom Playlists**: Organize your music any way you want
- **Drag & Drop Reordering**: Intuitive playlist management
- **Custom Cover Images**: Search Unsplash/Flickr or use stock images
- **Playlist Statistics**: Track listening time and song counts

### 🎵 Player Features
- **Full Audio Controls**: Play, pause, skip, repeat, and volume control
- **Like/Unlike Songs**: Build your favorite collection
- **Listening Sessions**: Track how long you listen to playlists
- **Crossfade Support**: Smooth transitions between songs

### 🔍 Discovery & Organization
- **Artist of the Day**: Discover new artists with LastFM integration
- **Advanced Search**: Find songs by title, artist, or album
- **Library Management**: Organize your collection with filters and sorting
- **Listening History**: Track your music journey

### 👤 User Management
- **JWT Authentication**: Secure login and session management
- **User Profiles**: Customizable profiles with avatar uploads
- **Listening Statistics**: Personal listening analytics
- **Admin Interface**: Comprehensive management tools

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs with automatic documentation
- **SQLAlchemy**: Powerful ORM for database operations with type safety
- **PostgreSQL**: Robust, production-ready relational database
- **Alembic**: Database migration tool for schema version control
- **JWT**: Secure authentication with JSON Web Tokens
- **Pydantic**: Data validation and settings management

### Frontend
- **React 18**: Modern UI library with hooks and functional components
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Router**: Client-side routing for single-page application
- **@dnd-kit**: Modern drag-and-drop library for playlist reordering

### External Integrations
- **Unsplash API**: High-quality image search for playlist covers
- **Flickr API**: Alternative image search with faster approval
- **LastFM API**: Artist information and discovery features

### Development Tools
- **ESLint**: Code linting and style enforcement
- **PostCSS**: CSS processing and optimization
- **Git**: Version control and collaboration

## 🏗️ Architecture

StreamFlow follows a modern microservices-inspired architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │  PostgreSQL DB  │
│   (TypeScript)  │◄──►│   (Python)      │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vite Dev      │    │   Alembic       │    │   File Storage  │
│   Server        │    │   Migrations    │    │   (Uploads)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

1. **Frontend Layer**: React SPA with TypeScript and Tailwind CSS
2. **API Layer**: FastAPI REST API with automatic OpenAPI documentation
3. **Data Layer**: SQLAlchemy ORM with PostgreSQL database
4. **File Storage**: Local file system for audio and image uploads
5. **External APIs**: Integration with image search and music metadata services

### Data Flow

1. **Authentication**: JWT tokens for secure API access
2. **File Upload**: Direct upload to backend with metadata extraction
3. **Streaming**: Range requests for efficient audio streaming
4. **Real-time Updates**: WebSocket-like updates for player state
5. **Caching**: Browser caching for static assets and API responses

## 🚀 Getting Started

### Quick Start

For detailed setup instructions, see our comprehensive **[Getting Started Guide](docs/getting-started.md)**.

**Prerequisites:**
- Python 3.8+
- Node.js 18+
- PostgreSQL 13+
- Git

**Basic Setup:**
```bash
# Clone the repository
git clone https://github.com/peetj/streamit.git
cd streamit

# Follow the detailed setup guide
# 📖 docs/getting-started.md
```

### What You'll Get

After setup, you'll have access to:
- **Frontend**: http://localhost:5173 - Modern React interface
- **Backend API**: http://localhost:8000 - FastAPI with auto-generated docs
- **Admin Interface**: http://localhost:8080 - Database management tools

## 📁 Project Structure

```
streamit/
├── app/                    # FastAPI backend application
│   ├── api/               # API route handlers
│   ├── models/            # SQLAlchemy database models
│   ├── schemas/           # Pydantic data schemas
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── client/                # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service functions
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── admin/                 # Admin interface (HTML/CSS/JS)
├── scripts/               # Utility and startup scripts
├── docs/                  # Documentation
├── uploads/               # File upload storage
└── alembic/               # Database migration files
```

## 🤝 Contributing

**Note:** This project is currently in active development and not accepting contributions at this time. We appreciate your interest and will update this section when we're ready to accept community contributions.

For support, questions, or feature requests, please open an issue on GitHub.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Unsplash** for high-quality image search API
- **Flickr** for alternative image search options
- **LastFM** for artist information and discovery
- **FastAPI** team for the excellent web framework
- **React** team for the amazing UI library

---

**Happy streaming! 🎵**