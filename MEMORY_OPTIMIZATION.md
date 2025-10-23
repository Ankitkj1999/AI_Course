# 🧠 Memory Optimization Guide

AiCourse provides multiple Docker setups optimized for different memory constraints.

## 🎯 Choose Your Setup

### 💪 Standard Setup (Recommended - 4GB+ RAM)
```bash
npm run docker:up
```
- **Memory Usage**: ~1GB runtime, ~2GB during build
- **Features**: Full multi-stage build, all optimizations
- **Best for**: Development, production servers

### 🪶 Light Setup (Low Memory - 2GB+ RAM)
```bash
npm run docker:up:light
```
- **Memory Usage**: ~512MB runtime, ~1GB during build
- **Features**: Single-stage build, production deps only
- **Best for**: VPS, limited memory environments

### 🔧 Simple Setup (Maximum Compatibility)
```bash
npm run docker:up:simple
# OR
npm run docker:build:simple
```
- **Memory Usage**: ~1GB runtime, ~1.5GB during build
- **Features**: Ultra-simple build, maximum compatibility
- **Best for**: Older Docker versions, problematic systems

### ⚡ Custom Low Memory Build
```bash
npm run docker:build:low-memory
```
- **Memory Usage**: Configurable limits
- **Features**: Custom memory constraints, manual control
- **Best for**: Very limited memory systems (if BuildKit available)

## 🔧 Memory Optimization Features

### Build Time Optimizations
- **Node.js heap limits**: `--max-old-space-size=2048`
- **npm optimizations**: `--prefer-offline --no-audit --progress=false`
- **Docker BuildKit**: Enabled for better caching
- **Reduced build context**: Enhanced .dockerignore

### Runtime Optimizations
- **Memory limits**: Docker compose mem_limit
- **Node.js heap limits**: Configurable via NODE_OPTIONS
- **Health check intervals**: Adjusted for low memory
- **Cache cleaning**: Automatic npm cache cleanup

## 📊 Memory Usage Comparison

| Setup | Build Memory | Runtime Memory | Build Time | Features |
|-------|--------------|----------------|------------|----------|
| Standard | ~2GB | ~1GB | Normal | Full multi-stage |
| Light | ~1GB | ~512MB | Faster | Single-stage |
| Custom | Configurable | Configurable | Variable | Manual control |

## 🚨 Troubleshooting Low Memory

### Build Fails with "Out of Memory"
```bash
# Try the light setup
npm run docker:up:light

# Or increase Docker memory in Docker Desktop
# Settings > Resources > Memory > Increase to 4GB+
```

### Container Keeps Restarting
```bash
# Check memory usage
docker stats aicourse-app

# View logs for memory errors
npm run docker:logs

# Try light setup with lower limits
npm run docker:up:light
```

### Slow Performance
```bash
# Check if memory limit is too low
docker stats

# Increase memory reservation
# Edit docker-compose.yml mem_reservation
```

## 💡 Tips for Very Low Memory Systems

1. **Close other applications** during Docker build
2. **Use light setup** for systems with <4GB RAM
3. **Enable swap** if available (not recommended for SSD)
4. **Build on a different machine** and transfer image
5. **Use pre-built images** from Docker Hub (if available)

## 🔍 Monitoring Memory Usage

```bash
# Real-time memory monitoring
docker stats aicourse-app

# Check system memory
free -h  # Linux/macOS
Get-ComputerInfo | Select-Object TotalPhysicalMemory  # Windows

# Docker system info
docker system df
docker system prune  # Clean up unused data
```

## 🎛️ Custom Memory Configuration

Edit `docker-compose.yml` to adjust memory limits:

```yaml
services:
  aicourse:
    # Build memory
    build:
      shm_size: '512mb'  # Reduce for very low memory
    
    # Runtime memory
    mem_limit: 512m      # Maximum memory
    mem_reservation: 256m # Guaranteed memory
    
    environment:
      # Node.js heap limit
      - NODE_OPTIONS=--max-old-space-size=384
```

---

**Need help?** Check the main [README.md](README.md) or open an issue on GitHub.