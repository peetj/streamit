#!/bin/bash

# Deploy StreamFlow application to Fly.io
set -e

echo "🚀 Starting deployment to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
fi

# Get app name from fly.toml
APP_NAME=$(grep '^app = ' fly.toml | cut -d'"' -f2)

if [ -z "$APP_NAME" ]; then
    echo "❌ Could not find app name in fly.toml"
    exit 1
fi

echo "📱 App name: $APP_NAME"

# Check if app exists
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo "🔧 Creating new app: $APP_NAME"
    flyctl apps create "$APP_NAME" --org personal
fi

# Create volume for uploads if it doesn't exist
VOLUME_NAME="streamflow_data"
if ! flyctl volumes list | grep -q "$VOLUME_NAME"; then
    echo "💾 Creating volume: $VOLUME_NAME"
    flyctl volumes create "$VOLUME_NAME" --size 10 --region iad
fi

# Set secrets if they don't exist
echo "🔐 Setting up secrets..."

# Check if DATABASE_URL secret exists
if ! flyctl secrets list | grep -q "DATABASE_URL"; then
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  DATABASE_URL not set. Please set it manually:"
        echo "   flyctl secrets set DATABASE_URL='your-database-url'"
    else
        flyctl secrets set DATABASE_URL="$DATABASE_URL"
    fi
fi

# Check if SECRET_KEY secret exists
if ! flyctl secrets list | grep -q "SECRET_KEY"; then
    if [ -z "$SECRET_KEY" ]; then
        echo "⚠️  SECRET_KEY not set. Please set it manually:"
        echo "   flyctl secrets set SECRET_KEY='your-secret-key'"
    else
        flyctl secrets set SECRET_KEY="$SECRET_KEY"
    fi
fi

# Set REDIS_URL if provided
if [ -n "$REDIS_URL" ] && ! flyctl secrets list | grep -q "REDIS_URL"; then
    flyctl secrets set REDIS_URL="$REDIS_URL"
fi

# Deploy the application
echo "🚀 Deploying application..."
flyctl deploy

# Check deployment status
echo "📊 Checking deployment status..."
flyctl status

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: https://$APP_NAME.fly.dev"
echo "📚 API documentation: https://$APP_NAME.fly.dev/docs" 