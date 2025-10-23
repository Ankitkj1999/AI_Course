# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd server && npm install --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci
RUN cd server && npm install

# Copy source code
COPY . .

# Build the application for production
RUN npm run build:prod

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Create logs directory and set permissions
RUN mkdir -p logs server/logs && chown -R appuser:nodejs /app

USER appuser

# Expose port
EXPOSE 5010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5010/health || exit 1

# Start the application
CMD ["node", "server/server.js"]
