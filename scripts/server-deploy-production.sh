#!/bin/bash

# Production Server Deployment Script
echo "🚀 Deploying AiCourse production on gksage.com..."

# Configuration
DOCKER_USERNAME="ankitkj199"
IMAGE_NAME="aicourse"
TAG="production"
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"
CONTAINER_NAME="aicourse-app"

# Check if we're in the right directory
if [ ! -f "server/.env.production" ]; then
    echo "❌ Error: server/.env.production file not found!"
    echo "💡 Creating production env file..."
    
    if [ -f "server/.env" ]; then
        cp server/.env server/.env.production
        echo "✅ Copied server/.env to server/.env.production"
        echo "📝 Please edit server/.env.production with production settings"
    else
        echo "❌ No env files found!"
        exit 1
    fi
fi

echo "✅ Found server/.env.production file"

# Stop and remove existing container
echo "🧹 Cleaning up existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Clean up old images (safer than full system prune)
echo "🧹 Cleaning up old Docker images..."
docker image prune -f
docker rmi $(docker images "$DOCKER_USERNAME/$IMAGE_NAME" -q | tail -n +3) 2>/dev/null || true

# Pull the production image
echo "📥 Pulling production image: $FULL_IMAGE_NAME"
docker pull $FULL_IMAGE_NAME

if [ $? -eq 0 ]; then
    echo "✅ Image pulled successfully!"
    echo "🚀 Starting production container..."
    
    # Run the container with production env
    docker run -d \
        --name $CONTAINER_NAME \
        -p 5010:5010 \
        --env-file server/.env.production \
        --restart unless-stopped \
        -v "$(pwd)/server/logs:/app/server/logs" \
        $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Production container started successfully!"
        echo "🌐 Application available at: https://gksage.com"
        echo "🌐 Alternative: https://www.gksage.com"
        echo "❤️  Health check: https://gksage.com/health"
        echo "📋 View logs: docker logs -f $CONTAINER_NAME"
        echo "🛑 Stop: docker stop $CONTAINER_NAME"
        
        # Wait and check health
        echo "⏳ Waiting for application to start..."
        sleep 15
        
        if curl -f http://localhost:5010/health >/dev/null 2>&1; then
            echo "✅ Application is healthy!"
        else
            echo "⚠️  Application may still be starting..."
            echo "📋 Check logs: docker logs $CONTAINER_NAME"
        fi
    else
        echo "❌ Failed to start container!"
        exit 1
    fi
else
    echo "❌ Failed to pull production image!"
    echo "💡 Make sure the production image exists: $FULL_IMAGE_NAME"
    exit 1
fi