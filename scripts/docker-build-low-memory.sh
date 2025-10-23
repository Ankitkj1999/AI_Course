#!/bin/bash

# Low Memory Docker Build Script for AiCourse
echo "🚀 Starting Low Memory Docker Build..."

# Set Docker build memory limits
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build with memory constraints
echo "📦 Building with memory optimizations..."
docker build \
  --memory=2g \
  --memory-swap=3g \
  --shm-size=1g \
  --build-arg NODE_OPTIONS="--max-old-space-size=2048" \
  -t aicourse-low-memory .

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 Starting container..."
    
    # Run with memory limits
    docker run -d \
      --name aicourse-app \
      --memory=1g \
      --memory-reservation=512m \
      -p 5010:5010 \
      --env-file server/.env \
      -e NODE_OPTIONS="--max-old-space-size=1024" \
      aicourse-low-memory
    
    echo "🌐 Application available at: http://localhost:5010"
    echo "❤️  Health check: http://localhost:5010/health"
else
    echo "❌ Build failed!"
    exit 1
fi