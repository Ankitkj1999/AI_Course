# 🚀 Deployment Guide

Complete guide for deploying AiCourse to production environments.

## 🏗️ Production Readiness Checklist

### ✅ Implemented Features
- [x] **Health Check Endpoint** - `/health` for monitoring
- [x] **Structured Logging** - Winston logger with file rotation
- [x] **Error Handling** - Comprehensive error middleware
- [x] **Graceful Shutdown** - Proper SIGTERM/SIGINT handling
- [x] **Docker Support** - Multi-stage Dockerfile and docker-compose
- [x] **Database Indexing** - Performance optimized indexes

### 🔄 Next Steps
- [ ] Process Management (PM2)
- [ ] Rate Limiting
- [ ] Security Headers
- [ ] SSL/TLS Configuration

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Prepare Environment**
   ```bash
   # Copy environment file
   cp server/.env.example server/.env
   # Edit with your production values
   nano server/.env
   ```

2. **Build and Run**
   ```bash
   # Build and start all services
   docker-compose up -d
   
   # Check logs
   docker-compose logs -f aicourse
   ```

3. **Verify Deployment**
   ```bash
   # Check health
   curl http://localhost:5010/health
   
   # Check application
   curl http://localhost:80
   ```

### Production Docker Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  aicourse:
    build: .
    restart: always
    environment:
      - NODE_ENV=production
    env_file:
      - server/.env.production
    ports:
      - "5010:5010"
    volumes:
      - ./logs:/app/server/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5010/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## ☁️ Cloud Platform Deployment

### Vercel + Railway

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod
```

**Backend (Railway):**
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### AWS Deployment

**Using AWS ECS:**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -t aicourse .
docker tag aicourse:latest <account>.dkr.ecr.us-east-1.amazonaws.com/aicourse:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/aicourse:latest
```

### DigitalOcean Droplet

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/yourusername/aicourse.git
cd aicourse

# Setup environment
cp server/.env.example server/.env
nano server/.env

# Deploy
docker-compose up -d
```

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=5010
WEBSITE_URL=https://yourdomain.com

# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aicourse

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# API Keys (Production keys)
API_KEY=your-production-google-ai-key
STRIPE_SECRET_KEY=sk_live_your-live-stripe-key
PAYPAL_CLIENT_ID=your-live-paypal-client-id

# Email (Production SMTP)
EMAIL=noreply@yourdomain.com
PASSWORD=your-production-email-password

# Monitoring
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
```

## 🔒 Security Configuration

### SSL/TLS Setup

**Using Let's Encrypt with Nginx:**
```nginx
# /etc/nginx/sites-available/aicourse
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:5010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:5010/health;
        access_log off;
    }
}
```

### Security Headers

Add to your Nginx configuration:
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 📊 Monitoring & Logging

### Health Check Monitoring

The `/health` endpoint provides comprehensive system status:

```json
{
  "status": "OK",
  "timestamp": "2023-10-13T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "ai": "connected"
  },
  "memory": {
    "used": "150 MB",
    "total": "200 MB"
  }
}
```

### Log Management

**Production Logging:**
- Error logs: `server/logs/error.log`
- Combined logs: `server/logs/combined.log`
- Exception logs: `server/logs/exceptions.log`

**Log Rotation (using logrotate):**
```bash
# /etc/logrotate.d/aicourse
/path/to/aicourse/server/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        systemctl reload aicourse
    endscript
}
```

### Monitoring Tools

**Recommended monitoring stack:**
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Logs**: ELK Stack, Splunk
- **Errors**: Sentry, Bugsnag

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Your deployment script here
          echo "Deploying to production..."
```

## 🚨 Troubleshooting Production Issues

### Common Issues

1. **Health Check Failing**
   ```bash
   # Check logs
   docker-compose logs aicourse
   
   # Check database connection
   docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"
   ```

2. **High Memory Usage**
   ```bash
   # Monitor memory
   docker stats aicourse
   
   # Check for memory leaks in logs
   grep -i "memory" server/logs/error.log
   ```

3. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   docker-compose exec aicourse node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI);
   console.log('Connected successfully');
   "
   ```

### Performance Optimization

1. **Enable Gzip Compression**
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
   ```

2. **Database Optimization**
   ```javascript
   // Add in mongo-init.js
   db.courses.createIndex({ "user": 1, "date": -1 });
   db.courses.createIndex({ "mainTopic": "text", "content": "text" });
   ```

3. **Caching Headers**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## 📋 Post-Deployment Checklist

- [ ] Health check endpoint responding
- [ ] Database connections working
- [ ] SSL certificate valid
- [ ] All environment variables set
- [ ] Logs being written correctly
- [ ] Email functionality working
- [ ] Payment gateways configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Domain DNS configured
- [ ] CDN configured (if applicable)

## 🆘 Support

For deployment issues:
- 📧 Email: spacester.app@gmail.com
- 🐛 GitHub Issues: [Report deployment issues](https://github.com/yourusername/aicourse/issues)
- 📖 Documentation: Check other docs in this folder

---

**Next Steps:** After successful deployment, consider implementing the remaining production readiness features from the [roadmap](roadmap.md).