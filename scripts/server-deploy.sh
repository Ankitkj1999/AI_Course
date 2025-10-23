#!/bin/bash

# Server Deployment Script
echo "🚀 Deploying AiCourse on server..."

# Configuration
DOCKER_USERNAME="ankitkj199"
IMAGE_NAME="aicourse"
TAG=${1:-latest}
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"
CONTAINER_NAME="aicourse-app"

# Check if we're in the right directory
if [ ! -f "server/.env" ]; then
    echo "❌ Error: server/.env file not found!"
    echo "💡 Please run this from the project root directory"
    echo "📋 Current directory: $(pwd)"
    echo "📋 Expected files: server/.env, package.json"
    
    if [ -f ".env.example" ] || [ -f "server/.env.example" ]; then
        echo "📋 Copy example: cp server/.env.example server/.env"
        echo "📝 Then edit server/.env with your configuration"
    fi
    exit 1
fi

echo "✅ Found server/.env file"

# Stop and remove existing container
echo "🧹 Cleaning up existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Pull the latest image
echo "📥 Pulling image: $FULL_IMAGE_NAME"
docker pull $FULL_IMAGE_NAME

if [ $? -eq 0 ]; then
    echo "✅ Image pulled successfully!"
    echo "🚀 Starting container..."
    
    # Run the container
    docker run -d \
        --name $CONTAINER_NAME \
        -p 5010:5010 \
        --env-file server/.env \
        --restart unless-stopped \
        -v "$(pwd)/server/logs:/app/server/logs" \
        $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "🌐 Application available at: http://localhost:5010"
        echo "❤️  Health check: http://localhost:5010/health"
        echo "📋 View logs: docker logs -f $CONTAINER_NAME"
        echo "🛑 Stop: docker stop $CONTAINER_NAME"
        
        # Wait a moment and check health
        echo "⏳ Waiting for application to start..."
        sleep 15
        
        if curl -f http://localhost:5010/health >/dev/null 2>&1; then
            echo "✅ Application is healthy!"
            curl -s http://localhost:5010/health | head -3
        else
            echo "⚠️  Application may still be starting..."
            echo "📋 Check logs: docker logs $CONTAINER_NAME"
            echo "📋 Check container: docker ps"
        fi
    else
        echo "❌ Failed to start container!"
        echo "📋 Check Docker logs: docker logs $CONTAINER_NAME"
        exit 1
    fi
else
    echo "❌ Failed to pull image!"
    echo "💡 Make sure the image exists: $FULL_IMAGE_NAME"
    echo "💡 Check Docker Hub: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
    exit 1
fi