# EC2 Deployment Setup Guide

This guide explains how to set up automated deployment to EC2 using GitHub Actions.

## Overview

The deployment workflow automatically:
1. Builds a Docker image when you push to the `production` branch
2. Pushes the image to Docker Hub
3. SSHs into your EC2 instance
4. Pulls the latest image and restarts the container

## Prerequisites

- AWS EC2 instance running with Docker installed
- Docker Hub account
- GitHub repository with Actions enabled

## Step 1: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets

1. **DOCKER_USERNAME**: Your Docker Hub username (e.g., `ankitkj199`)
2. **DOCKER_PASSWORD**: Your Docker Hub password or access token
3. **EC2_HOST**: Your EC2 instance public IP or domain (e.g., `54.123.45.67` or `gksage.com`)
4. **EC2_USERNAME**: SSH username for EC2 (usually `ubuntu` for Ubuntu, `ec2-user` for Amazon Linux)
5. **EC2_SSH_KEY**: Your EC2 private SSH key (entire content of your .pem file)

### How to Add Secrets

```bash
# Navigate to your GitHub repository
# Go to: Settings → Secrets and variables → Actions → New repository secret
```


## Step 2: Prepare Your EC2 Instance

### Install Docker on EC2

SSH into your EC2 instance and install Docker:

```bash
# For Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# For Amazon Linux 2
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Log out and back in for group changes to take effect
```

### Create Required Directories

```bash
mkdir -p ~/aicourse/server/logs
mkdir -p ~/aicourse/server
```

### Create Environment File

Create your production environment file on EC2:

```bash
nano ~/aicourse/server/.env.production
```

Add your production environment variables (refer to `.env.example` in the repo).


## Step 3: Configure Security Groups

Ensure your EC2 security group allows:

- **Port 22**: SSH access (for deployment)
- **Port 5010**: Application access (or your configured APP_PORT)
- **Port 80/443**: If using a reverse proxy (recommended for production)

## Step 4: Test Manual Deployment

Before relying on GitHub Actions, test manual deployment:

```bash
# On your EC2 instance
cd ~/aicourse
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/production/scripts/ec2-deploy.sh
chmod +x ec2-deploy.sh
./ec2-deploy.sh
```

## Step 5: Trigger Automated Deployment

Once everything is configured, simply push to the production branch:

```bash
git checkout production
git merge main  # or your development branch
git push origin production
```

The GitHub Action will automatically:
1. Build the Docker image
2. Push to Docker Hub
3. Deploy to EC2


## Monitoring and Troubleshooting

### View GitHub Actions Logs

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click on the latest workflow run
4. View logs for each step

### View Application Logs on EC2

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# View container logs
docker logs -f aicourse-app

# View last 100 lines
docker logs --tail 100 aicourse-app

# Check container status
docker ps -a

# Check application health
curl http://localhost:5010/health
```

### Common Issues

**Issue**: Container fails to start
- Check logs: `docker logs aicourse-app`
- Verify environment file exists: `ls -la ~/aicourse/server/.env.production`
- Check port availability: `sudo netstat -tulpn | grep 5010`

**Issue**: GitHub Action fails at SSH step
- Verify EC2_SSH_KEY secret is correct (entire .pem file content)
- Check EC2 security group allows SSH from GitHub Actions IPs
- Verify EC2_HOST and EC2_USERNAME are correct

**Issue**: Image pull fails
- Verify Docker Hub credentials are correct
- Check image exists: `docker pull ankitkj199/aicourse:latest`


## Configuration Options

### Customizing Ports

To change the application port, update these locations:

1. **GitHub workflow** (`.github/workflows/docker-deploy.yml`):
   ```yaml
   env:
     APP_PORT: 5010  # Change this
   ```

2. **EC2 deployment script** (`scripts/ec2-deploy.sh`):
   ```bash
   APP_PORT="${APP_PORT:-5010}"  # Change default
   ```

3. **EC2 Security Group**: Allow the new port

### Using a Different Branch

To deploy from a different branch, edit `.github/workflows/docker-deploy.yml`:

```yaml
on:
  push:
    branches:
      - main  # Change from 'production' to 'main'
```

### Environment Variables

The deployment uses `~/aicourse/server/.env.production` on EC2. Key variables:

- `PORT`: Application port (should match internal port 5010)
- `NODE_ENV`: Set to `production`
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret
- Other app-specific variables

## Production Best Practices

1. **Use HTTPS**: Set up SSL/TLS with Let's Encrypt or AWS Certificate Manager
2. **Reverse Proxy**: Use Nginx or Caddy in front of your app
3. **Monitoring**: Set up CloudWatch or similar monitoring
4. **Backups**: Regular database backups
5. **Secrets Management**: Consider AWS Secrets Manager for sensitive data
6. **Health Checks**: Configure ELB health checks if using load balancer

## Next Steps

- Set up domain and SSL certificate
- Configure Nginx reverse proxy
- Set up monitoring and alerts
- Configure automated backups
- Review security best practices
