#!/bin/bash

# Pull and Run from Docker Hub Script
echo "🚀 Pulling and running AiCourse from Docker Hub..."

# Configuration
DOCKER_USERNAME="ankitkj199"
IMAGE_NAME="aicourse"
TAG=${1:-latest}
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"
CONTAINER_NAME="aicourse-app"

echo "📥 Pulling image: $FULL_IMAGE_NAME"

# Stop and remove existing container
echo "🧹 Cleaning up existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Pull the latest image
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
        $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "🌐 Application available at: http://localhost:5010"
        echo "❤️  Health check: http://localhost:5010/health"
        echo "📋 View logs: docker logs -f $CONTAINER_NAME"
        echo "🛑 Stop: docker stop $CONTAINER_NAME"
        
        # Wait a moment and check health
        echo "⏳ Waiting for application to start..."
        sleep 10
        
        if curl -f http://localhost:5010/health >/dev/null 2>&1; then
            echo "✅ Application is healthy!"
        else
            echo "⚠️  Application may still be starting. Check logs: docker logs $CONTAINER_NAME"
        fi
    else
        echo "❌ Failed to start container!"
        exit 1
    fi
else
    echo "❌ Failed to pull image!"
    echo "💡 Make sure the image exists: $FULL_IMAGE_NAME"
    exit 1
fi