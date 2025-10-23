#!/bin/bash

# Multi-Platform Docker Build Script
echo "🚀 Building AiCourse for multiple platforms..."

# Configuration
DOCKER_USERNAME="ankitkj199"
IMAGE_NAME="aicourse"
TAG=${1:-latest}
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

echo "📦 Building multi-platform image: $FULL_IMAGE_NAME"

# Check if buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    echo "❌ Docker buildx not available!"
    echo "💡 Falling back to single platform build..."
    
    # Fallback to regular build with platform specification
    if [[ $(uname -m) == "arm64" ]] || [[ $(uname -m) == "aarch64" ]]; then
        echo "🍎 Building for linux/amd64 (server compatibility)..."
        docker build --platform linux/amd64 -t $FULL_IMAGE_NAME .
    else
        echo "🐧 Building for current platform..."
        docker build -t $FULL_IMAGE_NAME .
    fi
else
    echo "🔧 Using Docker buildx for multi-platform build..."
    
    # Create builder if it doesn't exist
    docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform
    
    # Build for multiple platforms
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t $FULL_IMAGE_NAME \
        --push \
        .
    
    if [ $? -eq 0 ]; then
        echo "✅ Multi-platform build and push completed!"
        echo "🌐 Image: $FULL_IMAGE_NAME"
        echo "📋 Platforms: linux/amd64, linux/arm64"
        echo "📋 Pull command: docker pull $FULL_IMAGE_NAME"
        exit 0
    else
        echo "❌ Multi-platform build failed!"
        exit 1
    fi
fi

# Continue with single platform build and push
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📤 Pushing to Docker Hub..."
    
    docker push $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to Docker Hub!"
        echo "🌐 Image: $FULL_IMAGE_NAME"
        echo "📋 Pull command: docker pull $FULL_IMAGE_NAME"
    else
        echo "❌ Failed to push to Docker Hub!"
        echo "💡 Make sure you're logged in: docker login"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi