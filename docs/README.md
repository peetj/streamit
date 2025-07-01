# StreamFlow Documentation

Welcome to the StreamFlow documentation! Here you'll find everything you need to get started, develop, and deploy your music streaming application.

## 📚 Quick Start Guides

- **[Docker Quickstart](docker-quickstart.md)** - Get up and running with Docker in minutes
- **[Getting Started](getting-started.md)** - Traditional setup without Docker
- **[Deployment Guide](../README_DEPLOYMENT.md)** - Comprehensive deployment documentation

## 🚀 Deployment

- **Docker Quickstart** - Fastest way to deploy with Docker
- **Fly.io Deployment** - Deploy to Fly.io cloud platform
- **Railway Deployment** - Deploy to Railway platform

## 🛠️ Development

- **Local Development** - Set up your development environment
- **API Documentation** - Available at `/docs` when running the app
- **Database Migrations** - Using Alembic for schema changes

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
└── uploads/               # File storage
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT secret key |
| `REDIS_URL` | No | Redis connection string |
| `PORT` | No | Server port (default: 8000) |

### Database Setup

The application uses PostgreSQL with the following features:
- User authentication and authorization
- Song metadata and file management
- Playlist creation and management
- Listening session tracking
- Like/unlike functionality

## 🎵 Features

- **Music Streaming**: Upload and stream audio files
- **Playlist Management**: Create and manage playlists
- **User Authentication**: JWT-based authentication
- **File Upload**: Audio and image upload support
- **Real-time Features**: WebSocket support for real-time updates
- **Admin Panel**: Administrative tools and monitoring

## 🧪 Testing

- **Unit Tests**: Located in `tests/` directory
- **Integration Tests**: Test API endpoints
- **Docker Testing**: Test Docker builds locally

## 📊 Monitoring

- **Health Checks**: `/health` endpoint
- **Logging**: Structured logging throughout the application
- **Metrics**: Performance monitoring capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

- **Issues**: Report bugs and feature requests
- **Discussions**: Ask questions and share ideas
- **Documentation**: Keep this guide updated

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 