// ============================================================================
// IMPORTS
// ============================================================================

// Core dependencies
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import fs from "fs/promises";
import path from "path";

// External services
import { createApi } from "unsplash-js";

// Internal utilities
import logger from "./utils/logger.js";
import { generateUniqueSlug, extractTitleFromContent } from "./utils/slugify.js";
import { generateCourseSEO } from "./utils/seo.js";
import { getServerPort, getServerURL, validateConfig } from "./utils/config.js";
import { safeGet, safeGetArray, safeGetFirst } from "./utils/safeAccess.js";

// Middleware
import errorHandler from "./middleware/errorHandler.js";
import { requireAuth, optionalAuth } from "./middleware/authMiddleware.js";
import { uploadConfig } from "./middleware/uploadMiddleware.js";

// Services
import llmService from "./services/llmService.js";
import settingsCache from "./services/settingsCache.js";
import databaseOptimizationService from "./services/databaseOptimization.js";
import cachingService from "./services/cachingService.js";
import relatedModelMigrationService from "./services/relatedModelMigration.js";
import { cleanupFile } from "./services/fileCleanup.js";

// Models
import { Course, Quiz } from "./models/index.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contentGenerationRoutes from "./routes/contentGenerationRoutes.js";
import utilityRoutes from "./routes/utilityRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import llmRoutes, { initializeLlmRoutes } from "./routes/llmRoutes.js";
import courseRoutes, { initializeCourseRoutes } from "./routes/courseRoutes.js";
import publicContentRoutes, { initializePublicContentRoutes } from "./routes/publicContentRoutes.js";
import quizRoutes, { initializeQuizRoutes } from "./routes/quizRoutes.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

dotenv.config();
validateConfig();

const PORT = process.env.PORT;
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// Body parsing
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    // Allow all localhost in development
    if (process.env.NODE_ENV !== "production") {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (localhostRegex.test(origin)) {
        return callback(null, true);
      }
    }

    // Build allowed origins list
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    const allowedOrigins = [
      process.env.WEBSITE_URL,
      `http://localhost:${process.env.PORT}`,
      `https://localhost:${process.env.PORT}`,
      "http://localhost:5010",
      "https://localhost:5010",
      "https://gksage.com",
      "https://www.gksage.com",
      "http://gksage.com",
      "http://www.gksage.com",
      ...envOrigins,
    ].filter(Boolean);

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isProductionDomain = /^https?:\/\/(www\.)?gksage\.com$/.test(origin);

    if (allowedOrigins.includes(origin) || isLocalhost || isProductionDomain) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Request logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
});

mongoose.connection.on("connected", () => logger.info("MongoDB connected successfully"));
mongoose.connection.on("error", (err) => logger.error("MongoDB connection error:", err));
mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

// ============================================================================
// ROUTE INITIALIZATION
// ============================================================================

// Initialize routes that need dependency injection
initializeLlmRoutes({ llmService, logger, requireAuth });

initializeCourseRoutes({
  requireAuth,
  optionalAuth,
  logger,
  unsplash,
  safeGet,
  safeGetArray,
  safeGetFirst,
  generateUniqueSlug,
  extractTitleFromContent,
  generateCourseSEO
});

initializePublicContentRoutes({
  requireAuth,
  optionalAuth,
  logger,
  Course,
  Quiz,
  generateUniqueSlug
});

initializeQuizRoutes({
  requireAuth,
  optionalAuth,
  logger,
  llmService
});

// ============================================================================
// MOUNT ROUTES
// ============================================================================

// Auth & User
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Admin
app.use('/api', adminRoutes);

// Core features
app.use('/api/courses', courseRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api', contentGenerationRoutes);
app.use('/api', publicContentRoutes);

// Payments
app.use('/api', paymentRoutes);

// Utilities & misc
app.use('/api', llmRoutes);
app.use('/api', utilityRoutes);
app.use('/api', contactRoutes);
app.use('/api', settingsRoutes);
app.use('/api', blogRoutes);
app.use('/api', apiRoutes);

// ============================================================================
// STATIC FILES & SPA FALLBACK
// ============================================================================

app.use(express.static("../dist"));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  
  res.sendFile("index.html", { root: "../dist" }, (err) => {
    if (err) {
      logger.error(`Error serving index.html: ${err.message}`);
      res.status(404).send("Frontend not built. Run npm run build in the root directory.");
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

const initializeServices = async () => {
  try {
    // Settings cache
    await settingsCache.preload();
    logger.info("Settings cache initialized");

    // Database optimizations
    await databaseOptimizationService.initialize();
    logger.info("Database optimizations initialized");

    // Run migrations
    const migrationResults = await relatedModelMigrationService.migrateAllModels({
      dryRun: false,
      batchSize: 50
    });
    logger.info("Related model migration completed:", migrationResults);

    // Consistency checks
    const consistencyResults = await relatedModelMigrationService.performConsistencyChecks();
    if (consistencyResults.orphanedLanguages > 0) {
      logger.warn("Found orphaned data:", consistencyResults);
    }
  } catch (error) {
    logger.error("Service initialization failed:", error);
  }
};

const startFileCleanupJob = () => {
  const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
  const FILE_MAX_AGE = 60 * 60 * 1000; // 1 hour

  const cleanupStaleFiles = async () => {
    try {
      const tempDir = uploadConfig.tempDir;
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > FILE_MAX_AGE) {
            if (await cleanupFile(filePath)) deletedCount++;
          }
        } catch (error) {
          logger.error(`Cleanup error for ${file}: ${error.message}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup: ${deletedCount} stale files deleted`);
      }
    } catch (error) {
      logger.error(`Cleanup job failed: ${error.message}`);
    }
  };

  cleanupStaleFiles();
  setInterval(cleanupStaleFiles, CLEANUP_INTERVAL);
  logger.info("File cleanup job initialized (every 15 minutes)");
};

const gracefulShutdown = (server, signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info("HTTP server closed");
    
    try {
      databaseOptimizationService.cleanup();
      cachingService.cleanup();
    } catch (error) {
      logger.error("Cleanup error:", error);
    }

    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async () => {
  try {
    const serverPort = await getServerPort(PORT);
    const serverURL = getServerURL(serverPort);

    const server = app.listen(serverPort, async () => {
      logger.info(`🚀 Server running on ${serverURL}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      
      await initializeServices();
      startFileCleanupJob();

      process.env.ACTUAL_PORT = serverPort.toString();
      process.env.ACTUAL_SERVER_URL = serverURL;
    });

    process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown(server, "SIGINT"));

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
