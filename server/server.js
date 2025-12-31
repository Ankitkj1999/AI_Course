// IMPORT
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createApi } from "unsplash-js";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import {
  generateUniqueSlug,
  extractTitleFromContent,
} from "./utils/slugify.js";

import {
  Course,
  Quiz,
} from "./models/index.js";
import settingsCache from "./services/settingsCache.js";
import {
  requireAuth,
  optionalAuth
} from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contentGenerationRoutes from "./routes/contentGenerationRoutes.js";
import utilityRoutes from "./routes/utilityRoutes.js";
import llmRoutes, { initializeLlmRoutes } from "./routes/llmRoutes.js";
import courseRoutes, { initializeCourseRoutes } from "./routes/courseRoutes.js";
import publicContentRoutes, { initializePublicContentRoutes } from "./routes/publicContentRoutes.js";
import quizRoutes, { initializeQuizRoutes } from "./routes/quizRoutes.js";
import { generateCourseSEO } from "./utils/seo.js";
import { getServerPort, getServerURL, validateConfig } from "./utils/config.js";
import llmService from "./services/llmService.js";
import { safeGet, safeGetArray, safeGetFirst } from "./utils/safeAccess.js";
import fs from "fs/promises";
import path from "path";
import apiRoutes from "./routes/apiRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import databaseOptimizationService from "./services/databaseOptimization.js";
import cachingService from "./services/cachingService.js";
import relatedModelMigrationService from "./services/relatedModelMigration.js";

// NOTE: Google Generative AI SDK is still available for future advanced features
// such as Gemini Live APIs, Deep Research, Google Search integration, etc.
// Currently using LangChain for standardized multi-model support.

// Load environment variables
dotenv.config();

// Validate configuration
validateConfig();


//INITIALIZE
const app = express();

// Configure CORS - Simplified for Docker setup
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins in development
    if (process.env.NODE_ENV !== "production") {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (localhostRegex.test(origin)) {
        logger.info(`CORS: Allowing development origin: ${origin}`);
        return callback(null, true);
      }
    }

    // Get allowed origins from environment or use defaults
    const envOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [];

    const allowedOrigins = [
      process.env.WEBSITE_URL,
      `http://localhost:${process.env.PORT}`,
      `https://localhost:${process.env.PORT}`,
      "http://localhost:5010",
      "https://localhost:5010",
      // Production domains
      "https://gksage.com",
      "https://www.gksage.com",
      "http://gksage.com",
      "http://www.gksage.com",
      // Additional origins from environment
      ...envOrigins,
    ].filter(Boolean);

    // Also allow any localhost origin and production domains
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
      origin
    );
    const isProductionDomain = /^https?:\/\/(www\.)?gksage\.com$/.test(origin);

    if (allowedOrigins.includes(origin) || isLocalhost || isProductionDomain) {
      logger.info(`CORS: Allowing origin: ${origin}`);
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

// Handle preflight requests
app.options("*", cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

const PORT = process.env.PORT;
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
});

// MongoDB connection event handlers
mongoose.connection.on("connected", async () => {
  logger.info("MongoDB connected successfully");

  // Temporarily disable startup functions to isolate the issue
  /*
  try {
    // Initialize database optimizations
    await databaseOptimizationService.initializeIndexes();
    logger.info("Database indexes initialized");
    
    // Run related model migration
    await relatedModelMigrationService.migrateExistingData();
    logger.info("Related model migration completed");
    
    // Fix any invalid Lexical content
    await fixLexicalContent();
    logger.info("Lexical content cleanup completed");
    
  } catch (error) {
    logger.error("Startup initialization error:", error);
  }
  */
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

// All Mongoose schemas are now defined in separate model files in the models/ directory
// Models are imported from models/index.js at the top of this file

// Authentication middleware is imported from middleware/authMiddleware.js
// Authentication routes are mounted from routes/authRoutes.js

//REQUEST

// Mount authentication routes
app.use('/api', authRoutes);

// Mount admin routes
app.use('/api', adminRoutes);

// Mount payment routes
app.use('/api', paymentRoutes);

// Mount user profile routes
app.use('/api', userRoutes);

// Mount content generation routes
app.use('/api', contentGenerationRoutes);

// Initialize and mount LLM routes
initializeLlmRoutes({ llmService, logger, requireAuth });
app.use('/api', llmRoutes);

// Initialize and mount course routes
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
app.use('/api/courses', courseRoutes);

// Mount utility routes
app.use('/api', utilityRoutes);

// Initialize and mount public content routes
initializePublicContentRoutes({
  requireAuth,
  optionalAuth,
  logger,
  Course,
  Quiz,
  generateUniqueSlug
});
app.use('/api', publicContentRoutes);

// Initialize and mount quiz routes
initializeQuizRoutes({
  requireAuth,
  optionalAuth,
  logger,
  llmService
});
app.use('/api/quiz', quizRoutes);
app.use('/api/quizzes', quizRoutes);  // For GET /api/quizzes endpoint

// Mount contact routes
app.use('/api', contactRoutes);

// Mount settings routes
app.use('/api', settingsRoutes);

// Mount blog routes
app.use('/api', blogRoutes);

// NEW API ROUTES (Section-based architecture)
// Mount the new API routes with enhanced course management
app.use('/api', apiRoutes);

//STATIC FILE SERVING
// Serve static files from the dist directory (in parent directory)
app.use(express.static("../dist"));

// Catch-all handler: send back index.html for client-side routing
// Only for non-API routes
app.get("*", (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Send index.html for client-side routing
  res.sendFile("index.html", { root: "../dist" }, (err) => {
    if (err) {
      logger.error(`Error serving index.html: ${err.message}`);
      // If dist doesn't exist (development), just send a simple response
      res
        .status(404)
        .send("Frontend not built. Run npm run build in the root directory.");
    }
  });
});

//LISTEN
// Error handling middleware (must be last)
app.use(errorHandler);

// Dynamic port handling
const startServer = async () => {
  try {
    const serverPort = await getServerPort(PORT);
    const serverURL = getServerURL(serverPort);

    const server = app.listen(serverPort, async () => {
      logger.info(`🚀 Server started successfully!`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🌐 Server URL: ${serverURL}`);
      logger.info(`❤️  Health check: ${serverURL}/api/health`);
      logger.info(`🔗 API Base URL: ${serverURL}/api`);

      // Initialize settings cache
      try {
        await settingsCache.preload();
        logger.info(`⚙️  Settings cache initialized`);
      } catch (error) {
        logger.error(`❌ Settings cache initialization failed:`, error);
      }

      // Initialize database optimizations
      try {
        await databaseOptimizationService.initialize();
        logger.info(`🔧 Database optimizations initialized`);
      } catch (error) {
        logger.error(`❌ Database optimization initialization failed:`, error);
      }

      // Initialize scheduled cleanup job for stale files
      const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
      const FILE_MAX_AGE = 60 * 60 * 1000; // 1 hour

      const cleanupStaleFiles = async () => {
        try {
          logger.info("Running scheduled cleanup job for stale files");

          const tempDir = uploadConfig.tempDir;
          const now = Date.now();

          // Read all files in temp directory
          const files = await fs.readdir(tempDir);

          let deletedCount = 0;
          let errorCount = 0;

          for (const file of files) {
            try {
              const filePath = path.join(tempDir, file);
              const stats = await fs.stat(filePath);

              // Check if file is older than 1 hour
              const fileAge = now - stats.mtimeMs;

              if (fileAge > FILE_MAX_AGE) {
                const success = await cleanupFile(filePath);
                if (success) {
                  deletedCount++;
                  logger.info(
                    `Deleted stale file: ${file} (age: ${Math.round(
                      fileAge / 1000 / 60
                    )} minutes)`
                  );
                } else {
                  errorCount++;
                }
              }
            } catch (error) {
              logger.error(
                `Error processing file ${file} during cleanup: ${error.message}`
              );
              errorCount++;
            }
          }

          if (deletedCount > 0 || errorCount > 0) {
            logger.info(
              `Cleanup job completed: ${deletedCount} files deleted, ${errorCount} errors`
            );
          }
        } catch (error) {
          logger.error(`Scheduled cleanup job failed: ${error.message}`);
        }
      };

      // Run cleanup immediately on startup
      cleanupStaleFiles();

      // Schedule cleanup to run every 15 minutes
      setInterval(cleanupStaleFiles, CLEANUP_INTERVAL);
      logger.info(
        `🧹 Scheduled cleanup job initialized (runs every ${CLEANUP_INTERVAL / 1000 / 60
        } minutes)`
      );

      // Update environment variables for other parts of the app
      process.env.ACTUAL_PORT = serverPort.toString();
      process.env.ACTUAL_SERVER_URL = serverURL;

      // Log port change if different from preferred
      if (serverPort !== PORT) {
        logger.warn(
          `⚠️  Using port ${serverPort} instead of preferred port ${PORT}`
        );
        logger.info(`💡 Update your frontend VITE_SERVER_URL to: ${serverURL}`);
      }
    });

    return server;
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const server = await startServer();


// Public content routes (visibility, discovery, fork) are now in routes/publicContentRoutes.js

// Use API routes
app.use('/api', apiRoutes);

// Initialize optimization services and run migrations on startup
const initializeServer = async () => {
  try {
    logger.info('🚀 Initializing server...');

    // Initialize database optimization services
    await databaseOptimizationService.initialize();
    // cachingService initializes itself when imported
    logger.info('✅ Optimization services initialized');

    // Run related model migration
    logger.info('🔄 Running related model migration...');
    const migrationResults = await relatedModelMigrationService.migrateAllModels({
      dryRun: false,
      batchSize: 50
    });
    logger.info('✅ Related model migration completed:', migrationResults);

    // Perform consistency checks
    const consistencyResults = await relatedModelMigrationService.performConsistencyChecks();
    if (consistencyResults.orphanedLanguages > 0) {
      logger.warn('⚠️ Found orphaned data:', consistencyResults);
    } else {
      logger.info('✅ Data consistency check passed');
    }

  } catch (error) {
    logger.error('❌ Server initialization failed:', error);
    // Continue startup even if migration fails
  }
};

// Start server
const launchServer = async () => {
  try {
    const serverPort = await getServerPort();
    const httpServer = app.listen(serverPort, async () => {
      logger.info(`🌟 Server running on port ${serverPort}`);
      logger.info(`🌐 Server URL: ${getServerURL(serverPort)}`);

      // Initialize services and run migrations
      await initializeServer();
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      httpServer.close(() => {
        logger.info("HTTP server closed.");

        // Cleanup optimization services
        try {
          databaseOptimizationService.cleanup();
          cachingService.cleanup();
          logger.info("Optimization services cleaned up.");
        } catch (error) {
          logger.error("Error cleaning up optimization services:", error);
        }

        // Close database connection
        mongoose.connection.close(false, () => {
          logger.info("MongoDB connection closed.");
          process.exit(0);
        });
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
launchServer();
