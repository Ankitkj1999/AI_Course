# Deployment Changes Summary

## What Changed

This repository now has automated CI/CD deployment to EC2 via GitHub Actions.

## Files Modified

### 1. `.github/workflows/docker-deploy.yml`
**Changes:**
- Added `deploy` job that runs after `build-and-push`
- Integrated `appleboy/ssh-action` to SSH into EC2
- Automated container deployment on EC2
- Added paths-ignore to skip deployments for documentation changes
- Added proper environment variable passing

**Key additions:**
- EC2 deployment step with SSH
- Graceful container shutdown and restart
- Port conflict resolution
- Automatic cleanup of old images

## Files Created

### 2. `scripts/ec2-deploy.sh`
**Purpose:** Standalone deployment script that can be run directly on EC2

**Features:**
- Pull latest Docker image
- Stop and remove old container
- Start new container with proper configuration
- Health checks
- Logging and error handling

### 3. `docs/EC2_DEPLOYMENT_SETUP.md`
**Purpose:** Complete setup guide for EC2 deployment

**Covers:**
- GitHub Secrets configuration
- EC2 instance preparation
- Docker installation
- Security group setup
- Troubleshooting guide

### 4. `DEPLOYMENT.md`
**Purpose:** Quick reference for deployment operations

**Includes:**
- Automated deployment instructions
- Manual deployment options
- Monitoring commands
- Rollback procedures

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

1. `DOCKER_USERNAME` - Already configured (ankitkj199)
2. `DOCKER_PASSWORD` - Docker Hub password/token
3. `EC2_HOST` - Your EC2 public IP or domain
4. `EC2_USERNAME` - SSH username (ubuntu or ec2-user)
5. `EC2_SSH_KEY` - Complete private SSH key (.pem file content)

## Next Steps

1. **Add GitHub Secrets** (see docs/EC2_DEPLOYMENT_SETUP.md)
2. **Prepare EC2 Instance:**
   - Install Docker
   - Create directories: `~/aicourse/server/logs`
   - Create environment file: `~/aicourse/server/.env.production`
3. **Test deployment:**
   - Push to production branch
   - Monitor GitHub Actions
   - Verify application is running on EC2

## Deployment Flow

```
Push to production branch
    ↓
GitHub Actions triggered
    ↓
Build Docker image (linux/amd64)
    ↓
Push to Docker Hub (ankitkj199/aicourse:latest)
    ↓
SSH into EC2
    ↓
Pull latest image
    ↓
Stop old container
    ↓
Start new container
    ↓
Verify deployment
```

## Configuration

- **Container Name:** aicourse-app
- **Port Mapping:** 5010:5010
- **Image:** ankitkj199/aicourse:latest
- **Restart Policy:** unless-stopped
- **Logs:** Mounted to ~/aicourse/server/logs
- **Environment:** ~/aicourse/server/.env.production
