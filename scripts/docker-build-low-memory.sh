#!/bin/bash

# Low Memory Docker Build Script for AiCourse
echo "🚀 Starting Low Memory Docker Build..."

# Check if BuildKit is available
if docker buildx version >/dev/null 2>&1; then
    echo "📦 Building with BuildKit optimizations..."
    export DOCKER_BUILDKIT=1
    export BUILDKIT_PROGRESS=plain
    
    # Build with BuildKit and memory constraints
    docker build \
      --memory=2g \
      --memory-swap=3g \
      --shm-size=1g \
      --build-arg NODE_OPTIONS="--max-old-space-size=2048" \
      -t aicourse-low-memory .
else
    echo "📦 Building with legacy Docker (no BuildKit)..."
    
    # Build without BuildKit
    docker build \
      --build-arg NODE_OPTIONS="--max-old-space-size=2048" \
      -t aicourse-low-memory .
fi

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 Starting container..."
    
    # Stop existing container if running
    docker stop aicourse-app 2>/dev/null || true
    docker rm aicourse-app 2>/dev/null || true
    
    # Run with memory limits
    docker run -d \
      --name aicourse-app \
      --memory=1g \
      --memory-reservation=512m \
      -p 5010:5010 \
      --env-file server/.env \
      -e NODE_OPTIONS="--max-old-space-size=1024" \
      --restart unless-stopped \
      aicourse-low-memory
    
    echo "🌐 Application available at: http://localhost:5010"
    echo "❤️  Health check: http://localhost:5010/health"
    echo "📋 View logs: docker logs -f aicourse-app"
else
    echo "❌ Build failed!"
    exit 1
fi