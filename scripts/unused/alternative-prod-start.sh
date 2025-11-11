#!/bin/bash

# A script to set up and run the application in a production environment on a single server.
# This script should be run from the root of the project.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting Production Deployment Script ---"

# --- Prerequisites Check ---
# Make sure Node.js and npm are installed.
if ! [ -x "$(command -v node)" ]; then
  echo "Error: node is not installed. Please install Node.js to continue." >&2
  exit 1
fi

# --- Step 1: Install Dependencies ---
echo "Installing root (frontend) dependencies..."
npm install

echo "Installing server (backend) dependencies..."
(cd server && npm install)

# --- Step 2: Build the Frontend ---
echo "Building the frontend application..."
# This command creates the static files in the 'dist' directory.
npm run build

# --- Step 3: Start the Backend Server with PM2 ---
echo "Starting the backend server..."

# Check if pm2 is installed globally, and install it if it's not.
if ! [ -x "$(command -v pm2)" ]; then
  echo "PM2 not found. Installing pm2 globally..."
  npm install pm2 -g
fi

# Start or restart the Node.js server.
# This will run the server in the background and restart it automatically if it crashes.
pm2 start server/server.js --name "aicourse-api" --update-env

# Save the current process list to be resurrected on server reboot.
pm2 save

echo "--- Deployment Finished Successfully ---"
echo ""
echo "Your backend API is now running and managed by pm2."
echo "You can check its status with the command: pm2 list"
echo ""
echo "Next Steps for Manual Nginx Configuration:"
echo "1. Point your Nginx server block to serve static files from: $(pwd)/dist"
echo "2. Create a location block in Nginx to reverse proxy '/api' requests to your running server at http://localhost:5010"

