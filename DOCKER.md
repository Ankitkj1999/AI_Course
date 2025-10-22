# 🐳 Docker Deployment Guide

Quick guide for running AiCourse with Docker.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/aicourse.git
cd aicourse

# 2. Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your API keys

# 3. Start the application
npm run docker:up
```

**Access the application at:** http://localhost:5010

## 📋 Docker Commands

### Basic Commands
```bash
# Start application (builds automatically)
npm run docker:up

# Start in background
npm run docker:up:detached

# Stop application
npm run docker:down

# View logs
npm run docker:logs

# Restart containers
npm run docker:restart

# Check health
npm run health
```

### Direct Docker Compose Commands
```bash
# Start with build
docker-compose up --build

# Start in background
docker-compose up --build -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f aicourse-app

# Restart
docker-compose restart
```

## 🔧 Configuration

### Environment Variables
Make sure to set these in `server/.env`:

**Required:**
```env
MONGODB_URI=your_mongodb_connection_string
API_KEY=your_google_ai_api_key
EMAIL=your_gmail_address
PASSWORD=your_gmail_app_password
PORT=5010
NODE_ENV=production
```

**Optional:**
```env
WEBSITE_URL=http://localhost:5010
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

### Docker Compose Configuration
The `docker-compose.yml` includes:
- **Port mapping**: 5010:5010
- **Environment**: Production mode
- **Health checks**: Automatic monitoring
- **Restart policy**: Unless stopped
- **Volume mounting**: For persistent logs

## 🏗️ Docker Architecture

### Multi-stage Build
1. **Base stage**: Node.js Alpine with curl
2. **Dependencies stage**: Install production dependencies
3. **Builder stage**: Install all dependencies and build
4. **Runner stage**: Final production image

### Security Features
- Non-root user (`appuser`)
- Minimal Alpine Linux base
- Production-only dependencies
- Health check monitoring

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
npm run docker:logs

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
npm run docker:up
```

### Port Already in Use
```bash
# Stop existing containers
docker-compose down

# Check what's using the port
lsof -i :5010

# Kill the process if needed
sudo kill -9 <PID>
```

### Health Check Failing
```bash
# Check health endpoint manually
curl http://localhost:5010/health

# Check container status
docker ps

# View detailed logs
docker-compose logs -f aicourse-app
```

### CORS Issues
If you get CORS errors, make sure:
1. `WEBSITE_URL` is set correctly in `.env`
2. The application is accessed via the correct URL
3. No proxy or firewall is interfering

## 📊 Monitoring

### Health Check
```bash
# Quick health check
npm run health

# Detailed health info
curl http://localhost:5010/health | jq
```

### Container Status
```bash
# Check running containers
docker ps

# Check container resource usage
docker stats aicourse-app
```

### Logs
```bash
# Follow logs in real-time
npm run docker:logs

# View last 50 lines
docker-compose logs --tail=50 aicourse-app

# View logs since specific time
docker-compose logs --since="2024-01-01T00:00:00" aicourse-app
```

## 🚀 Production Deployment

### Recommended Production Setup
1. **Use environment-specific `.env` files**
2. **Set up reverse proxy (nginx)**
3. **Configure SSL certificates**
4. **Set up log rotation**
5. **Configure monitoring and alerts**

### Production Environment Variables
```env
NODE_ENV=production
PORT=5010
WEBSITE_URL=https://yourdomain.com
# ... other production values
```

### Docker Compose Override
Create `docker-compose.prod.yml` for production-specific settings:
```yaml
version: '3.8'
services:
  aicourse:
    restart: always
    environment:
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      # Add your production labels here
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

**For development setup, see:** [DEVELOPMENT.md](DEVELOPMENT.md)
**For complete documentation, see:** [README.md](README.md)