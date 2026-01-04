#!/bin/bash

# EC2 Deployment Script for AiCourse
# This script is designed to run on the EC2 instance

set -e  # Exit on error

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-ankitkj199}"
IMAGE_NAME="${IMAGE_NAME:-aicourse}"
CONTAINER_NAME="${CONTAINER_NAME:-aicourse-app}"
APP_PORT="${APP_PORT:-5010}"
INTERNAL_PORT="5010"
ENV_FILE="${ENV_FILE:-~/AI_Course/server/.env.production}"
LOG_DIR="${LOG_DIR:-~/AI_Course/server/logs}"

echo "🚀 Starting AiCourse deployment on EC2..."
echo "📦 Image: $DOCKER_USERNAME/$IMAGE_NAME:latest"
echo "🐳 Container: $CONTAINER_NAME"
echo "🔌 Port: $APP_PORT:$INTERNAL_PORT"

# Ensure required directories exist
echo "📁 Ensuring directories exist..."
mkdir -p ~/AI_Course/server/logs
mkdir -p ~/AI_Course/server

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: $ENV_FILE not found!"
    echo "💡 Please create the environment file before deployment"
    echo "📝 Example: cp ~/aicourse/server/.env.example $ENV_FILE"
    exit 1
fi

echo "✅ Environment file found: $ENV_FILE"

# Pull the latest image
echo "📥 Pulling latest image from Docker Hub..."
docker pull $DOCKER_USERNAME/$IMAGE_NAME:latest

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull image!"
    exit 1
fi

echo "✅ Image pulled successfully!"

# Stop and remove old container gracefully
echo "🛑 Stopping old container..."
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo "Found running container, stopping gracefully..."
    docker stop -t 10 $CONTAINER_NAME
fi

# Remove container by name (running, stopped, or created)
if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
    echo "Removing existing container: $CONTAINER_NAME"
    docker rm -f $CONTAINER_NAME
fi

# Verify port is free, force cleanup if needed
echo "🔍 Verifying port availability..."
if docker ps -q --filter "publish=$APP_PORT" | grep -q .; then
    echo "⚠️  Warning: Found container using port $APP_PORT, forcing removal..."
    docker ps -q --filter "publish=$APP_PORT" | xargs docker rm -f
fi

# Brief pause for OS to release resources
echo "⏳ Waiting for port to be released..."
sleep 2

# Run new container
echo "🚀 Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $APP_PORT:$INTERNAL_PORT \
    -v $LOG_DIR:/app/server/logs \
    --env-file $ENV_FILE \
    $DOCKER_USERNAME/$IMAGE_NAME:latest

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    exit 1
fi

echo "✅ Container started successfully!"

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -af --filter "label=org.opencontainers.image.title=$IMAGE_NAME" || true

# Show running containers
echo ""
echo "📊 Deployment complete! Running containers:"
docker ps --filter "name=$CONTAINER_NAME"

# Wait for application to start
echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Show logs
echo ""
echo "📋 Container logs (last 50 lines):"
docker logs --tail 50 $CONTAINER_NAME

# Health check
echo ""
echo "❤️  Checking application health..."
if curl -f http://localhost:$APP_PORT/health >/dev/null 2>&1; then
    echo "✅ Application is healthy!"
    echo "🌐 Application is running at http://localhost:$APP_PORT"
else
    echo "⚠️  Health check failed or application still starting..."
    echo "💡 Check logs: docker logs -f $CONTAINER_NAME"
fi

echo ""
echo "✅ Deployment completed!"
echo "📋 Useful commands:"
echo "   View logs: docker logs -f $CONTAINER_NAME"
echo "   Stop: docker stop $CONTAINER_NAME"
echo "   Restart: docker restart $CONTAINER_NAME"
echo "   Remove: docker rm -f $CONTAINER_NAME"
