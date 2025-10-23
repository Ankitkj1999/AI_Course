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

# Standard setup (4GB+ RAM)
npm run docker:up

# Low memory setup (2GB+ RAM)
npm run docker:up:light
```
**→ Access:** http://localhost:5010

## 🎯 Key Commands

| Task | Local Dev | Docker (Standard) | Docker (Low Memory) |
|------|-----------|-------------------|---------------------|
| **Start** | `npm run dev:full` | `npm run docker:up` | `npm run docker:up:light` |
| **Start (bg)** | `npm run dev:clean` | `npm run docker:up:detached` | `npm run docker:up:light:detached` |
| **Stop** | `Ctrl+C` | `npm run docker:down` | `npm run docker:down:light` |
| **Memory** | ~2GB | ~1GB runtime | ~512MB runtime |
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