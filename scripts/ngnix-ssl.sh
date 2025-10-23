#!/bin/bash

# Nginx and SSL Setup Script for gksage.com
# This script configures Nginx as a reverse proxy and sets up SSL with Certbot

set -e  # Exit on any error

echo "🚀 Starting Nginx and SSL setup for gksage.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DOMAIN="gksage.com"
WWW_DOMAIN="www.gksage.com"
EMAIL="ankit.k.j1999@gmail.com"  # ⚠️ CHANGE THIS TO YOUR EMAIL
APP_PORT=5010

echo -e "${YELLOW}⚠️  Please update the EMAIL variable in this script before running!${NC}"
read -p "Press enter to continue or Ctrl+C to exit..."

# Update system packages
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# Install Nginx
echo -e "${GREEN}🔧 Installing Nginx...${NC}"
sudo apt install nginx -y

# Install Certbot and Nginx plugin
echo -e "${GREEN}🔒 Installing Certbot...${NC}"
sudo apt install certbot python3-certbot-nginx -y

# Stop Nginx temporarily
echo -e "${GREEN}🛑 Stopping Nginx...${NC}"
sudo systemctl stop nginx

# Create Nginx configuration for the application
echo -e "${GREEN}📝 Creating Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/gksage.com > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;

    # For Certbot challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS (will be used after SSL is configured)
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;

    # SSL certificates (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/gksage_access.log;
    error_log /var/log/nginx/gksage_error.log;

    # Client body size limit (adjust as needed)
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Proxy headers
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$APP_PORT/health;
        access_log off;
    }

    # API endpoints
    location /api {
        proxy_pass http://localhost:$APP_PORT/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Remove default Nginx configuration
echo -e "${GREEN}🗑️  Removing default Nginx configuration...${NC}"
sudo rm -f /etc/nginx/sites-enabled/default

# Enable the new configuration
echo -e "${GREEN}🔗 Enabling site configuration...${NC}"
sudo ln -sf /etc/nginx/sites-available/gksage.com /etc/nginx/sites-enabled/

# Test Nginx configuration
echo -e "${GREEN}✅ Testing Nginx configuration...${NC}"
sudo nginx -t

# Start Nginx
echo -e "${GREEN}▶️  Starting Nginx...${NC}"
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow Nginx through firewall
echo -e "${GREEN}🔥 Configuring firewall...${NC}"
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Obtain SSL certificate
echo -e "${GREEN}🔒 Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}Note: Make sure your domain is pointing to this server's IP address!${NC}"
read -p "Press enter to continue with SSL setup or Ctrl+C to exit..."

sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Test SSL renewal
echo -e "${GREEN}🔄 Testing SSL certificate auto-renewal...${NC}"
sudo certbot renew --dry-run

# Setup auto-renewal cron job (Certbot usually does this automatically)
echo -e "${GREEN}⏰ Setting up auto-renewal...${NC}"
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Restart Nginx to apply all changes
echo -e "${GREEN}🔄 Restarting Nginx...${NC}"
sudo systemctl restart nginx

# Display status
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}📊 Service Status:${NC}"
sudo systemctl status nginx --no-pager | head -10
echo ""
echo -e "${GREEN}🔒 SSL Certificate Status:${NC}"
sudo certbot certificates
echo ""
echo -e "${GREEN}🌐 Your site should now be accessible at:${NC}"
echo -e "   https://$DOMAIN"
echo -e "   https://$WWW_DOMAIN"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   1. Make sure your Docker container is running on port $APP_PORT"
echo "   2. Update your frontend VITE_SERVER_URL to: https://$DOMAIN"
echo "   3. SSL certificates will auto-renew via Certbot"
echo ""
echo -e "${GREEN}📝 Useful commands:${NC}"
echo "   - Check Nginx status: sudo systemctl status nginx"
echo "   - Restart Nginx: sudo systemctl restart nginx"
echo "   - Check SSL status: sudo certbot certificates"
echo "   - Renew SSL manually: sudo certbot renew"
echo "   - View Nginx logs: sudo tail -f /var/log/nginx/gksage_error.log"