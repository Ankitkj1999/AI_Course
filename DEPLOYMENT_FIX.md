# Deployment Fix Guide

## Issues Found

1. **Docker image not found** - The `latest` tag wasn't being created because `production` isn't the default branch
2. **Environment file path wrong** - Should be `~/AI_Course/server/.env.production` not `~/aicourse/...`

## Fixes Applied

### 1. Updated GitHub Workflow
- Changed tag generation to always create `latest` and `production` tags
- Fixed environment file path to `~/AI_Course/server/.env.production`
- Added directory creation and env file check before deployment

### 2. Updated Deployment Scripts
- Fixed paths to match your EC2 directory structure (`~/AI_Course/`)
- Created initial setup script for EC2

## Immediate Actions Required

### On Your EC2 Instance

SSH into your EC2 instance and run:

```bash
# Create the environment file
mkdir -p ~/AI_Course/server
nano ~/AI_Course/server/.env.production
```

Add your production environment variables (copy from your existing setup or `.env.example`).

### Quick Setup Option

Or use the automated setup script:

```bash
# On EC2
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/AI_Course/production/scripts/ec2-initial-setup.sh
chmod +x ec2-initial-setup.sh
./ec2-initial-setup.sh
```

Then edit the environment file:
```bash
nano ~/AI_Course/server/.env.production
```

## Restore Your Previous Container

Your old container is still there but stopped. To restart it:

```bash
# On EC2
docker start aicourse-app

# Or if you want to use the old image
docker run -d \
  --name aicourse-app \
  --restart unless-stopped \
  -p 5010:5010 \
  -v ~/AI_Course/server/logs:/app/server/logs \
  --env-file ~/AI_Course/server/.env.production \
  ankitkj199/aicourse:production
```

## Test New Deployment

Once the environment file is in place:

```bash
# Push to production branch to trigger deployment
git add .
git commit -m "Fix deployment configuration"
git push origin production
```

Or test manually on EC2:

```bash
cd ~/AI_Course
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/AI_Course/production/scripts/ec2-deploy.sh
chmod +x ec2-deploy.sh
./ec2-deploy.sh
```

## Verify Deployment

```bash
# Check container is running
docker ps | grep aicourse-app

# Check logs
docker logs -f aicourse-app

# Test health endpoint
curl http://localhost:5010/health
```

## Summary of Path Changes

| Old Path | New Path |
|----------|----------|
| `~/aicourse/server/.env.production` | `~/AI_Course/server/.env.production` |
| `~/aicourse/server/logs` | `~/AI_Course/server/logs` |

This matches your existing EC2 directory structure shown in your docker ps output.
