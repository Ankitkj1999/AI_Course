#!/bin/bash

# Production Build and Push Script
echo "🚀 Building AiCourse for production (gksage.com)..."

# Configuration
DOCKER_USERNAME="ankitkj199"
IMAGE_NAME="aicourse"
TAG=${1:-production}
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

echo "📦 Building production image: $FULL_IMAGE_NAME"

# Build with production environment
if [[ $(uname -m) == "arm64" ]] || [[ $(uname -m) == "aarch64" ]]; then
    echo "🍎 Detected ARM64 (Apple Silicon), building for linux/amd64..."
    docker build --platform linux/amd64 \
        --build-arg VITE_WEBSITE_URL=https://gksage.com \
        --build-arg VITE_SERVER_URL=https://gksage.com \
        -t $FULL_IMAGE_NAME .
else
    echo "🐧 Detected AMD64, building normally..."
    docker build \
        --build-arg VITE_WEBSITE_URL=https://gksage.com \
        --build-arg VITE_SERVER_URL=https://gksage.com \
        -t $FULL_IMAGE_NAME .
fi

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📤 Pushing to Docker Hub..."
    
    # Push to Docker Hub
    docker push $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed production image!"
        echo "🌐 Image: $FULL_IMAGE_NAME"
        echo "📋 Production domains: gksage.com, www.gksage.com"
        echo "📋 Pull command: docker pull $FULL_IMAGE_NAME"
        echo "🚀 Deploy command: docker run -d -p 5010:5010 --env-file server/.env.production $FULL_IMAGE_NAME"
    else
        echo "❌ Failed to push to Docker Hub!"
        echo "💡 Make sure you're logged in: docker login"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi