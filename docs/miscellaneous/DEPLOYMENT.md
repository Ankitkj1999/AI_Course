# AiCourse Deployment Guide

Quick reference for deploying AiCourse to production.

## Automated Deployment (GitHub Actions)

Push to the `production` branch to trigger automatic deployment:

```bash
git checkout production
git merge main
git push origin production
```

This will:
1. Build Docker image
2. Push to Docker Hub (ankitkj199/aicourse)
3. Deploy to EC2 automatically

## Manual Deployment

### Option 1: Using GitHub Actions Manually

1. Go to GitHub → Actions
2. Select "Build and Deploy to EC2"
3. Click "Run workflow"

### Option 2: Deploy from EC2

SSH into your EC2 instance and run:

```bash
cd ~/aicourse
./ec2-deploy.sh
```

### Option 3: Local Build and Push

Build and push from your local machine:

```bash
# Build and push to Docker Hub
npm run docker:build:push

# Then SSH into EC2 and pull
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/aicourse
./ec2-deploy.sh
```

## Required GitHub Secrets

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `EC2_HOST`: EC2 public IP or domain
- `EC2_USERNAME`: SSH username (ubuntu/ec2-user)
- `EC2_SSH_KEY`: Private SSH key content

## Monitoring

```bash
# View logs
docker logs -f aicourse-app

# Check status
docker ps

# Health check
curl http://localhost:5010/health
```

## Rollback

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Pull specific version
docker pull ankitkj199/aicourse:production-abc123

# Stop current container
docker stop aicourse-app
docker rm aicourse-app

# Run previous version
docker run -d --name aicourse-app --restart unless-stopped \
  -p 5010:5010 -v ~/aicourse/server/logs:/app/server/logs \
  --env-file ~/aicourse/server/.env.production \
  ankitkj199/aicourse:production-abc123
```

For detailed setup instructions, see [docs/EC2_DEPLOYMENT_SETUP.md](docs/EC2_DEPLOYMENT_SETUP.md)
