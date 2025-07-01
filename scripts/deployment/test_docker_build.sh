#!/bin/bash

# Test Docker build locally before deploying to Fly.io
set -e

echo "🧪 Testing Docker build locally..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t streamflow-test .

# Test the build
echo "🧪 Testing the build..."
docker run --rm -d --name streamflow-test -p 8000:8000 \
    -e DATABASE_URL="postgresql://test:test@localhost/test" \
    -e SECRET_KEY="test-secret-key" \
    streamflow-test

# Wait for the container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -f http://localhost:8000/health; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs streamflow-test
    docker stop streamflow-test
    exit 1
fi

# Test main endpoint
echo "🏠 Testing main endpoint..."
if curl -f http://localhost:8000/; then
    echo "✅ Main endpoint working!"
else
    echo "❌ Main endpoint failed!"
fi

# Clean up
echo "🧹 Cleaning up..."
docker stop streamflow-test
docker rmi streamflow-test

echo "✅ Docker build test completed successfully!"
echo "🚀 Ready to deploy to Fly.io!" 