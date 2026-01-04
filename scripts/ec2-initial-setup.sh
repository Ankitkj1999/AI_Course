#!/bin/bash

# EC2 Initial Setup Script
# Run this once on your EC2 instance to prepare for deployments

set -e

echo "🚀 Setting up EC2 instance for AiCourse deployment..."

# Create required directories
echo "📁 Creating directories..."
mkdir -p ~/AI_Course/server/logs
mkdir -p ~/AI_Course/server

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Installing Docker..."
    
    # Detect OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    fi
    
    if [ "$OS" = "ubuntu" ]; then
        sudo apt-get update
        sudo apt-get install -y docker.io
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker ubuntu
        echo "✅ Docker installed for Ubuntu"
    elif [ "$OS" = "amzn" ]; then
        sudo yum update -y
        sudo yum install -y docker
        sudo service docker start
        sudo systemctl enable docker
        sudo usermod -aG docker ec2-user
        echo "✅ Docker installed for Amazon Linux"
    else
        echo "❌ Unsupported OS. Please install Docker manually."
        exit 1
    fi
    
    echo "⚠️  IMPORTANT: Log out and back in for Docker group changes to take effect!"
else
    echo "✅ Docker is already installed"
fi

# Check if user is in docker group
if groups | grep -q docker; then
    echo "✅ User is in docker group"
else
    echo "⚠️  User is not in docker group yet"
    echo "Run: sudo usermod -aG docker $USER"
    echo "Then log out and back in"
fi

# Create environment file template if it doesn't exist
if [ ! -f ~/AI_Course/server/.env.production ]; then
    echo "📝 Creating environment file template..."
    cat > ~/AI_Course/server/.env.production << 'EOF'
# AiCourse Production Environment Variables
# Edit this file with your production values

NODE_ENV=production
PORT=5010

# MongoDB
MONGODB_URI=mongodb://your-mongodb-uri

# JWT
JWT_SECRET=your-jwt-secret-here

# API Keys (if needed)
# OPENAI_API_KEY=your-key
# GOOGLE_API_KEY=your-key

# Add other environment variables as needed
EOF
    echo "✅ Created environment file template at ~/AI_Course/server/.env.production"
    echo "⚠️  IMPORTANT: Edit this file with your actual production values!"
    echo "   nano ~/AI_Course/server/.env.production"
else
    echo "✅ Environment file already exists"
fi

# Test Docker
echo "🧪 Testing Docker..."
if docker ps &> /dev/null; then
    echo "✅ Docker is working correctly"
else
    echo "⚠️  Docker test failed. You may need to log out and back in."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit environment file: nano ~/AI_Course/server/.env.production"
echo "2. If Docker group was just added, log out and back in"
echo "3. Test deployment: curl -O https://raw.githubusercontent.com/YOUR_REPO/production/scripts/ec2-deploy.sh && chmod +x ec2-deploy.sh && ./ec2-deploy.sh"
echo ""
echo "📁 Directory structure:"
echo "   ~/AI_Course/server/.env.production  (environment variables)"
echo "   ~/AI_Course/server/logs/            (application logs)"
