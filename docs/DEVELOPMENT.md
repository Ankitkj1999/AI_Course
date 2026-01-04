# 🚀 AiCourse Development Guide

Quick reference for developers working on AiCourse.

## 🏃‍♂️ Quick Start

### Local Development (Recommended for Development)
```bash
# Clone and setup
git clone https://github.com/yourusername/aicourse.git
cd aicourse
npm install

# Setup environment
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Start development (cleans ports automatically)
npm run dev:clean
```

**Access:** http://localhost:8080 (frontend) + http://localhost:5010 (API)

### Docker Deployment (Production-like Environment)
```bash
# Clone and setup
git clone https://github.com/yourusername/aicourse.git
cd aicourse

# Setup environment
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Start with Docker
npm run docker:up
```

**Access:** http://localhost:5010 (full application)

## 📋 Command Reference

### Development Commands
| Command | Description |
|---------|-------------|
| `npm run dev:full` | Start both frontend and backend |
| `npm run dev:clean` | Clean ports + start development |
| `npm run dev` | Frontend only (Vite) |
| `npm run server` | Backend only |
| `npm run server:dev` | Backend in development mode |

### Docker Commands
| Command | Description |
|---------|-------------|
| `npm run docker:up` | Build and start (foreground) |
| `npm run docker:up:detached` | Build and start (background) |
| `npm run docker:down` | Stop containers |
| `npm run docker:logs` | View logs |
| `npm run docker:restart` | Restart containers |
| `npm run health` | Check health status |

### Build Commands
| Command | Description |
|---------|-------------|
| `npm run build` | Build frontend for production |
| `npm run build:dev` | Build frontend for development |
| `npm run build:prod` | Build frontend for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## 🔧 Environment Setup

### Required Environment Variables
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# AI Service
API_KEY=your_google_ai_api_key

# Email
EMAIL=your_gmail_address
PASSWORD=your_gmail_app_password

# Application
PORT=5010
NODE_ENV=development
WEBSITE_URL=http://localhost:8080
```

### Optional Environment Variables
```env
# Payment Gateways
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_APP_SECRET_KEY=your_paypal_secret

# External APIs
UNSPLASH_ACCESS_KEY=your_unsplash_key

# Company Info
COMPANY=Your Company Name
LOGO=your_logo_url
```

## 🐛 Troubleshooting

### Port Conflicts
If you get port conflicts, use the clean script:
```bash
npm run dev:clean
```

### Docker Issues
```bash
# Stop all containers
npm run docker:down

# Rebuild from scratch
docker-compose build --no-cache
npm run docker:up
```

### Health Check
```bash
# Check if application is running
npm run health

# Or manually
curl http://localhost:5010/health
```

## 📁 Key Files

- `package.json` - Main dependencies and scripts
- `server/package.json` - Backend dependencies
- `server/.env` - Environment configuration
- `docker-compose.yml` - Docker configuration
- `Dockerfile` - Docker build instructions
- `scripts/unused/dev-setup.sh` - Development helper script (moved to unused folder)

## 🔄 Development Workflow

1. **Start Development**
   ```bash
   npm run dev:clean
   ```

2. **Make Changes**
   - Frontend: Changes auto-reload via Vite
   - Backend: Restart server manually or use nodemon

3. **Test with Docker**
   ```bash
   npm run docker:up
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🚀 Deployment

### Local Production Test
```bash
npm run build
npm run docker:up
```

### Production Deployment
1. Set production environment variables
2. Use Docker Compose with production configuration
3. Set up reverse proxy (nginx) if needed
4. Configure SSL certificates
5. Set up monitoring and logging

---

**Need Help?** Check the main [README.md](README.md) or open an issue on GitHub.