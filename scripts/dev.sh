#!/bin/bash

# Development script for AiCourse
echo "🚀 Starting AiCourse Development Environment"

# Kill existing processes on common ports
echo "📋 Cleaning up existing processes..."
for port in 5010 5011 5012 5013 8080 8081 8082 8083 8084; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Wait a moment
sleep 2

# Start the application
echo "🔥 Starting AiCourse with dynamic ports..."
npm run dev:full