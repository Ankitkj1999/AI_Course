# Quick Fix - Run These Commands on EC2 Now

## Step 1: Create the Environment File

```bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Create directory and env file
mkdir -p ~/AI_Course/server
nano ~/AI_Course/server/.env.production
```

Copy your environment variables into this file. You can reference your old container's env:

```bash
# See what env vars the old container had
docker inspect aicourse-app | grep -A 50 "Env"
```

## Step 2: Restart Your Old Container (Quick Fix)

If you want to get your app running immediately with the old image:

```bash
# Start the old container that's currently stopped
docker ps -a | grep aicourse

# If it shows as "Exited", restart it
docker start aicourse-app

# Check if it's running
docker ps | grep aicourse-app

# View logs
docker logs -f aicourse-app
```

## Step 3: Or Deploy Fresh

If you want to deploy fresh with the old production image:

```bash
# Remove the old container
docker rm -f aicourse-app

# Pull and run the old production image
docker pull ankitkj199/aicourse:production

docker run -d \
  --name aicourse-app \
  --restart unless-stopped \
  -p 5010:5010 \
  -v ~/AI_Course/server/logs:/app/server/logs \
  --env-file ~/AI_Course/server/.env.production \
  ankitkj199/aicourse:production
```

## Step 4: Test New Automated Deployment

Once the env file is in place, push to production branch:

```bash
# On your local machine
git add .
git commit -m "Fix deployment paths and configuration"
git push origin production
```

Watch the GitHub Actions tab to see the deployment progress.

## Verify Everything Works

```bash
# On EC2
docker ps
docker logs aicourse-app
curl http://localhost:5010/health

# From browser
http://your-domain-or-ip:5010
```

## What Was Wrong

1. **Image tag issue**: The workflow wasn't creating a `latest` tag - FIXED
2. **Path mismatch**: Workflow used `~/aicourse/` but your EC2 has `~/AI_Course/` - FIXED
3. **Missing env file**: The `.env.production` file didn't exist at the expected path - YOU NEED TO CREATE THIS

The old container is still there, just stopped. You can restart it immediately while we fix the automated deployment.
