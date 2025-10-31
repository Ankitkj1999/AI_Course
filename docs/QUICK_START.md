# ⚡ AiCourse Quick Start

## 🏃‍♂️ Two Ways to Run

### 🔧 Local Development
```bash
git clone <repo> && cd aicourse
npm install
cp server/.env.example server/.env  # Edit with your API keys
npm run dev:full
```
**→ Access:** http://localhost:8080

### 🐳 Docker
```bash
git clone <repo> && cd aicourse
cp server/.env.example server/.env  # Edit with your API keys
npm run docker:up
```
**→ Access:** http://localhost:5010

## 🎯 Key Commands

| Task | Local Dev | Docker | Docker Hub |
|------|-----------|--------|------------|
| **Start** | `npm run dev:full` | `npm run docker:up` | `npm run docker:up:hub` |
| **Start (bg)** | `npm run dev:clean` | `npm run docker:up:detached` | - |
| **Stop** | `Ctrl+C` | `npm run docker:down` | `npm run docker:down:hub` |
| **Deploy** | - | - | `npm run docker:deploy:production` |
| **Access** | http://localhost:8080 | http://localhost:5010 | http://localhost:5010 |

## 🔑 Required Environment Variables
```env
MONGODB_URI=your_mongodb_connection
API_KEY=your_google_ai_key
EMAIL=your_gmail_address
PASSWORD=your_gmail_app_password
```

## 📖 Full Documentation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete dev guide
- **[DOCKER.md](DOCKER.md)** - Docker-specific guide
- **[README.md](README.md)** - Full project documentation


✅ Ready to Use!
🏠 On Your Local Machine:
# 1. Login to Docker Hub
docker login

# 2. Build and push
npm run docker:build:push

# Or with a specific tag
npm run docker:build:push v1.0.0
🖥️ On Your EC2 Server:
# 1. Setup (one time)
git clone <your-repo>
cd aicourse
cp server/.env.example server/.env  # Edit with your API keys

# 2. Pull and run
npm run docker:pull:run

# Or use docker-compose
npm run docker:up:hub
🎯 Key Commands:
Build & Push: npm run docker:build:push [tag]
Pull & Run: npm run docker:pull:run [tag]
Docker Compose: npm run docker:up:hub
This approach will completely eliminate the memory issues on your EC2 server since you're not building there anymore! 🚀