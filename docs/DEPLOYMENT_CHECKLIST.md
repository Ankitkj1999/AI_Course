# EC2 Deployment Checklist

Use this checklist to ensure your deployment is properly configured.

## Pre-Deployment Setup

### GitHub Repository
- [ ] Repository has Actions enabled
- [ ] Added `DOCKER_USERNAME` secret
- [ ] Added `DOCKER_PASSWORD` secret
- [ ] Added `EC2_HOST` secret
- [ ] Added `EC2_USERNAME` secret
- [ ] Added `EC2_SSH_KEY` secret (entire .pem file)

### Docker Hub
- [ ] Docker Hub account created
- [ ] Repository `ankitkj199/aicourse` exists (or will be created on first push)
- [ ] Docker Hub credentials are valid

### EC2 Instance
- [ ] EC2 instance is running
- [ ] Docker is installed on EC2
- [ ] User added to docker group (`sudo usermod -aG docker ubuntu`)
- [ ] Logged out and back in after adding to docker group
- [ ] Directory created: `~/aicourse/server/logs`
- [ ] Directory created: `~/aicourse/server`
- [ ] Environment file created: `~/aicourse/server/.env.production`
- [ ] Environment file has all required variables

### Security Groups
- [ ] Port 22 (SSH) is open for GitHub Actions
- [ ] Port 5010 (or your APP_PORT) is open
- [ ] Port 80/443 open if using reverse proxy

### DNS (if applicable)
- [ ] Domain points to EC2 instance
- [ ] SSL certificate configured
- [ ] Reverse proxy configured (Nginx/Caddy)

## Testing

### Manual Deployment Test
- [ ] SSH into EC2 works: `ssh -i key.pem ubuntu@EC2_HOST`
- [ ] Docker commands work without sudo: `docker ps`
- [ ] Can pull from Docker Hub: `docker pull ankitkj199/aicourse:latest`
- [ ] Environment file is readable: `cat ~/aicourse/server/.env.production`
- [ ] Manual deployment script works: `./ec2-deploy.sh`

### Application Test
- [ ] Container starts successfully: `docker ps | grep aicourse-app`
- [ ] Health endpoint responds: `curl http://localhost:5010/health`
- [ ] Application is accessible from browser
- [ ] Logs are being written: `ls -la ~/aicourse/server/logs`

### GitHub Actions Test
- [ ] Push to production branch triggers workflow
- [ ] Build job completes successfully
- [ ] Deploy job completes successfully
- [ ] Application updates on EC2
- [ ] No errors in GitHub Actions logs

## Post-Deployment

### Monitoring
- [ ] Set up log monitoring
- [ ] Configure health check alerts
- [ ] Set up uptime monitoring
- [ ] Configure CloudWatch (if using AWS)

### Security
- [ ] Review security group rules
- [ ] Ensure secrets are not exposed in logs
- [ ] SSL/TLS configured for production
- [ ] Regular security updates scheduled

### Backup
- [ ] Database backup strategy in place
- [ ] Environment file backed up securely
- [ ] Disaster recovery plan documented

### Documentation
- [ ] Team knows how to deploy
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide accessible
- [ ] On-call procedures defined

## Common Issues Checklist

If deployment fails, check:

- [ ] All GitHub secrets are set correctly
- [ ] EC2 instance is running and accessible
- [ ] Docker is running on EC2: `sudo systemctl status docker`
- [ ] Port 5010 is not already in use: `sudo netstat -tulpn | grep 5010`
- [ ] Environment file exists and is valid
- [ ] Docker Hub credentials are correct
- [ ] SSH key has correct permissions (600)
- [ ] Security groups allow required ports
- [ ] Disk space available on EC2: `df -h`
- [ ] Memory available on EC2: `free -h`

## Rollback Checklist

If you need to rollback:

- [ ] Identify the previous working image tag
- [ ] SSH into EC2
- [ ] Stop current container
- [ ] Pull previous image version
- [ ] Start container with previous version
- [ ] Verify application works
- [ ] Document the issue
- [ ] Fix the issue before next deployment
