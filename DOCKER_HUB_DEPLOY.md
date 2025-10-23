# 🐳 Docker Hub Deployment Guide

Deploy AiCourse using pre-built Docker images from Docker Hub.

## 🎯 **Workflow Overview**

1. **Build locally** → 2. **Push to Docker Hub** → 3. **Pull & run on server**

## 🏠 **Local Machine (Build & Push)**

### Step 1: Login to Docker Hub
```bash
docker login
# Enter username: ankitkj199
# Enter password: [your-docker-hub-password]
```

### Step 2: Build and Push
```bash
# Build and push latest version (auto-detects platform)
npm run docker:build:push

# Build for multiple platforms (AMD64 + ARM64)
npm run docker:build:multiplatform

# Build and push with specific tag
npm run docker:build:push v1.0.0

# Manual cross-platform build (if on Apple Silicon)
docker build --platform linux/amd64 -t ankitkj199/aicourse:latest .
docker push ankitkj199/aicourse:latest
```

## 🖥️ **Server (EC2/VPS) - Pull & Run**

### Step 1: Setup Environment
```bash
# Clone repo (for .env file)
git clone https://github.com/yourusername/aicourse.git
cd aicourse

# Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your API keys
```

### Step 2: Pull and Run
```bash
# Method 1: Using deployment script (recommended)
npm run docker:deploy

# Method 2: Using pull script
npm run docker:pull:run

# Method 3: Using docker-compose
npm run docker:up:hub

# Method 4: Manual docker commands
docker pull ankitkj199/aicourse:latest
docker run -d -p 5010:5010 --env-file server/.env ankitkj199/aicourse:latest
```

## 📋 **Command Reference**

### Local Commands (Build & Push)
```bash
npm run docker:build:push           # Build and push :latest
npm run docker:build:push v1.0.0    # Build and push :v1.0.0
```

### Server Commands (Pull & Run)
```bash
npm run docker:pull:run             # Pull :latest and run
npm run docker:pull:run v1.0.0      # Pull :v1.0.0 and run
npm run docker:up:hub               # Use docker-compose
npm run docker:down:hub             # Stop docker-compose
npm run docker:logs:hub             # View logs
```

## 🔄 **Deployment Workflow**

### Initial Deployment
```bash
# Local
npm run docker:build:push

# Server
git clone <repo> && cd aicourse
cp server/.env.example server/.env  # Edit with your keys
npm run docker:pull:run
```

### Updates
```bash
# Local (after making changes)
npm run docker:build:push v1.1.0

# Server
npm run docker:pull:run v1.1.0
```

## 🎯 **Version Management**

### Tagging Strategy
```bash
npm run docker:build:push latest    # Latest development
npm run docker:build:push v1.0.0    # Stable release
npm run docker:build:push staging   # Staging environment
```

### Server Deployment
```bash
# Production
npm run docker:pull:run v1.0.0

# Staging
npm run docker:pull:run staging

# Development
npm run docker:pull:run latest
```

## 🔍 **Troubleshooting**

### Build Issues
```bash
# If build fails locally, try simple build first
npm run docker:build:simple
docker tag aicourse-app-simple ankitkj199/aicourse:latest
docker push ankitkj199/aicourse:latest
```

### Pull Issues
```bash
# Check if image exists
docker search ankitkj199/aicourse

# Manual pull
docker pull ankitkj199/aicourse:latest

# Check Docker Hub login
docker login
```

### Container Issues
```bash
# Check container status
docker ps -a

# View logs
docker logs aicourse-app

# Restart container
docker restart aicourse-app
```

## 🌐 **Access Points**

- **Application**: http://your-server-ip:5010
- **Health Check**: http://your-server-ip:5010/health

## 💡 **Benefits**

✅ **No building on server** (saves resources)
✅ **Faster deployments** (just pull & run)
✅ **Version control** (tag releases)
✅ **Consistent environments** (same image everywhere)
✅ **Easy rollbacks** (pull previous version)

---

**Docker Hub Repository**: https://hub.docker.com/r/ankitkj199/aicourse