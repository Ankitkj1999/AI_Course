#!/bin/bash

# Build and Push to Docker Hub Script
echo "🚀 Building and pushing AiCourse to Docker Hub..."

# Configuration
DOCKER_USERNAME="ankitkj199"
IMAGE_NAME="aicourse"
TAG=${1:-latest}
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

echo "📦 Building image: $FULL_IMAGE_NAME"

# Build the image
docker build -t $FULL_IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📤 Pushing to Docker Hub..."
    
    # Push to Docker Hub
    docker push $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to Docker Hub!"
        echo "🌐 Image: $FULL_IMAGE_NAME"
        echo "📋 Pull command: docker pull $FULL_IMAGE_NAME"
        echo "🚀 Run command: docker run -d -p 5010:5010 --env-file server/.env $FULL_IMAGE_NAME"
    else
        echo "❌ Failed to push to Docker Hub!"
        echo "💡 Make sure you're logged in: docker login"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi