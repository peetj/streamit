# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
ARG VITE_BACKEND_URL
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Python backend (serves built frontend as static files)
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /streamflow

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY scripts/ ./scripts/
COPY admin/ ./admin/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./frontend/

# Create necessary directories
RUN mkdir -p uploads/audio uploads/artwork uploads/profile

# Create a non-root user for security
RUN adduser --disabled-password --gecos '' streamflow_user
RUN chown -R streamflow_user:streamflow_user /streamflow
USER streamflow_user

# Expose the port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
