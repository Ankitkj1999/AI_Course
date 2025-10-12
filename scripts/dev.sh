#!/bin/bash

# Development script for AiCourse
echo "🚀 Starting AiCourse Development Environment"

# Kill existing processes on ports
echo "📋 Cleaning up existing processes..."
lsof -ti:5010 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Start the application
echo "🔥 Starting AiCourse..."
npm run dev:full