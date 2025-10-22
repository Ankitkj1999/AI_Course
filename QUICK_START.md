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

### 🐳 Docker (Production-like)
```bash
git clone <repo> && cd aicourse
cp server/.env.example server/.env  # Edit with your API keys
npm run docker:up
```
**→ Access:** http://localhost:5010

## 🎯 Key Commands

| Task | Local Dev | Docker |
|------|-----------|--------|
| **Start** | `npm run dev:full` | `npm run docker:up` |
| **Start (clean)** | `npm run dev:clean` | `npm run docker:up:detached` |
| **Stop** | `Ctrl+C` | `npm run docker:down` |
| **Logs** | Terminal output | `npm run docker:logs` |
| **Health** | http://localhost:5010/health | `npm run health` |

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