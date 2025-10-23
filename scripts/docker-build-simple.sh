#!/bin/bash

# Simple Docker Build Script for AiCourse (Works on all systems)
echo "🚀 Starting Simple Docker Build..."

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Build using docker-compose (most compatible)
echo "📦 Building with docker-compose (simple)..."
docker-compose -f docker-compose.simple.yml build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 Starting container..."
    
    # Start with docker-compose
    docker-compose -f docker-compose.simple.yml up -d
    
    echo "🌐 Application available at: http://localhost:5010"
    echo "❤️  Health check: http://localhost:5010/health"
    echo "📋 View logs: docker-compose -f docker-compose.simple.yml logs -f"
    echo "🛑 Stop: docker-compose -f docker-compose.simple.yml down"
else
    echo "❌ Build failed!"
    exit 1
fi