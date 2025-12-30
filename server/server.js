// IMPORT
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import gis from "g-i-s";
import youtubesearchapi from "youtube-search-api";
import { YoutubeTranscript } from "youtube-transcript";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { createApi } from "unsplash-js";
import showdown from "showdown";
import axios from "axios";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import {
  generateSlug,
  generateUniqueSlug,
  extractTitleFromContent,
} from "./utils/slugify.js";
import Settings from "./models/Settings.js";
import DocumentProcessing from "./models/DocumentProcessing.js";
import {
  Course,
  Section,
  Exam,
  Language,
  User,
  Admin,
  Subscription,
  Contact,
  Blog,
  Quiz,
  Flashcard,
} from "./models/index.js";
import settingsCache from "./services/settingsCache.js";
import {
  requireAuth,
  requireAdmin,
  requireMainAdmin,
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
import { uploadSingle, uploadConfig } from "./middleware/uploadMiddleware.js";
import {
  extractDocument,
  extractFromURL,
} from "./services/documentExtraction.js";
import { cleanupFile } from "./services/fileCleanup.js";
import fs from "fs/promises";
import path from "path";
import apiRoutes from "./routes/apiRoutes.js";
import databaseOptimizationService from "./services/databaseOptimization.js";
import cachingService from "./services/cachingService.js";
import relatedModelMigrationService from "./services/relatedModelMigration.js";
import fixLexicalContent from "./scripts/fixLexicalContent.js";

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
  Flashcard,
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


//GET PROFILE DETAILS
app.post("/api/profile", async (req, res) => {
  const { email, mName, password, uid } = req.body;
  try {
    if (password === "") {
      await User.findOneAndUpdate(
        { _id: uid },
        { $set: { email: email, mName: mName } }
      )
        .then((result) => {
          res.json({ success: true, message: "Profile Updated" });
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        });
    } else {
      await User.findOneAndUpdate(
        { _id: uid },
        { $set: { email: email, mName: mName, password: password } }
      )
        .then((result) => {
          res.json({ success: true, message: "Profile Updated" });
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        });
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Payment routes are now in routes/paymentRoutes.js

// Admin routes are now in routes/adminRoutes.js




//CONTACT
app.post("/api/contact", async (req, res) => {
  const { fname, lname, email, phone, msg } = req.body;
  try {
    const newContact = new Contact({ fname, lname, email, phone, msg });
    await newContact.save();
    res.json({ success: true, message: "Submitted" });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Admin routes are now in routes/adminRoutes.js

//GET PUBLIC SETTINGS (for client-side use)
app.get("/api/public/settings", async (req, res) => {
  try {
    const settings = await Settings.find({ isSecret: false });
    const publicSettings = {};

    settings.forEach((setting) => {
      publicSettings[setting.key] = {
        value: setting.value,
        category: setting.category,
        isSecret: setting.isSecret,
      };
    });

    res.json(publicSettings);
  } catch (error) {
    console.error("Public settings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//GENERATE EXAMS
app.post("/api/aiexam", requireAuth, async (req, res) => {
  const { courseId, mainTopic, subtopicsString, lang } = req.body;

  const existingNotes = await Exam.findOne({ course: courseId });
  if (existingNotes) {
    res.json({ success: true, message: existingNotes.exam });
  } else {
    const prompt = `Strictly in ${lang},
        generate a strictly 10 question MCQ quiz on title ${mainTopic} based on each topics :- ${subtopicsString}, Atleast One question per topic. Add options A, B, C, D and only one correct answer. Give your repones Strictly inJSON format like this :-
        {
          "${mainTopic}": [
            {
              "topic": "topic title",
              "question": "",
              "options": [
               "",
               "",
               "",
               ""
              ],
              "answer": "correct option like A, B, C, D"
            },
            {
              "topic": "topic title",
              "question": "",
              "options": [
               "",
               "",
               "",
               ""
              ],
              "answer": "correct option like A, B, C, D"
            },
            {
              "topic": "topic title",
              "question": "",
              "options": [
               "",
               "",
               "",
               ""
              ],
              "answer": "correct option like A, B, C, D"
            }
          ]
        }
        `;

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const genAI = await getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
    });

    await model
      .generateContent(prompt)
      .then(async (result) => {
        const response = result.response;
        const txt = response.text();
        let output = txt.slice(7, txt.length - 4);

        const newNotes = new Exam({
          course: courseId,
          exam: output,
          marks: "0",
          passed: false,
        });
        await newNotes.save();
        res.json({ success: true, message: output });
      })
      .catch((error) => {
        console.log(error);
        res.json({ success: false });
      });
  }
});

//UPDATE RESULT
app.post("/api/updateresult", async (req, res) => {
  const { courseId, marksString } = req.body;
  try {
    await Exam.findOneAndUpdate({ course: courseId }, [
      { $set: { marks: marksString, passed: true } },
    ])
      .then((result) => {
        res.json({ success: true });
      })
      .catch((error) => {
        res.json({ success: false });
      });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
});

//SEND EXAM
app.post("/api/sendexammail", async (req, res) => {
  const { html, email, subjects } = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "" + subjects,
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log("Error", error);
      res.status(500).json({ success: false, message: "Failed to send email" });
    } else {
      res.json({ success: true, message: "Email sent successfully" });
    }
  });
});

//GET COURSE PROGRESS (Renamed from getmyresult)
app.get("/api/course/:courseId/progress", requireAuth, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  try {
    // Check if user owns the course or has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check access permissions
    const isOwner = course.user === userId;
    const isPublic = course.isPublic === true;

    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Get exam results and language info using correct model names
    const examResult = await Exam.findOne({ courseId: courseId, userId: userId });
    const languageInfo = await Language.findOne({ courseId: courseId, userId: userId });

    const response = {
      success: true,
      courseId: courseId,
      progress: {
        hasExamResult: !!examResult,
        examPassed: examResult ? examResult.passed : false,
        examScore: examResult ? examResult.score : null,
        completedAt: examResult ? examResult.completedAt : null
      },
      language: languageInfo ? languageInfo.lang : "English",
      course: {
        title: course.title || course.mainTopic,
        slug: course.slug,
        isPublic: course.isPublic
      }
    };

    res.json(response);
  } catch (error) {
    logger.error("Get course progress error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

//BACKWARD COMPATIBILITY: Legacy getmyresult endpoint (DEPRECATED)
app.post("/api/getmyresult", async (req, res) => {
  const { courseId } = req.body;

  // Add deprecation warning to response headers
  res.set('X-API-Deprecated', 'true');
  res.set('X-API-Deprecated-Message', 'Use GET /api/course/:courseId/progress instead');

  try {
    // Use correct model names (Exam and Language instead of ExamSchema and LangSchema)
    const existingExam = await Exam.findOne({ courseId: courseId });
    const lang = await Language.findOne({ courseId: courseId });

    if (existingExam) {
      res.json({
        success: true,
        message: existingExam.passed,
        lang: lang ? lang.lang : "English",
        // Add migration hint
        _deprecated: "This endpoint is deprecated. Use GET /api/course/:courseId/progress instead"
      });
    } else {
      res.json({
        success: false,
        message: false,
        lang: lang ? lang.lang : "English",
        _deprecated: "This endpoint is deprecated. Use GET /api/course/:courseId/progress instead"
      });
    }
  } catch (error) {
    logger.error("Legacy getmyresult error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      _deprecated: "This endpoint is deprecated. Use GET /api/course/:courseId/progress instead"
    });
  }
});

//DELETE
app.post("/api/deleteuser", async (req, res) => {
  try {
    const { userId } = req.body;
    const deletedUser = await User.findOneAndDelete({ _id: userId });

    if (!deletedUser) {
      return res.json({ success: false, message: "Internal Server Error" });
    }

    await Course.deleteMany({ user: userId });
    await Subscription.deleteMany({ user: userId });

    return res.json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    console.log("Error", error);
    return res.json({ success: false, message: "Internal Server Error" });
  }
});

// Blog management routes are now in routes/adminRoutes.js

//GET ALL BLOGS (Public - no pagination)
app.get("/api/blogs/public", async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ date: -1 });

    res.json(blogs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

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

// Quiz routes are now in routes/quizRoutes.js

//CREATE FLASHCARD
app.post("/api/flashcard/create", requireAuth, async (req, res) => {
  // Generate request ID for logging correlation
  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  try {
    const { userId, keyword, title, provider, model, isPublic } = req.body;

    // Log request start
    logger.llm.logRequestStart(
      requestId,
      "/api/flashcard/create",
      {
        keyword,
        title,
        provider,
        model,
      },
      userId,
      provider
    );

    if (!userId || !keyword || !title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, keyword, title",
      });
    }

    // Generate flashcard content using AI
    const prompt = `Create a comprehensive set of flashcards for the topic: "${keyword}". 
        
        Generate 15-20 flashcards that cover the key concepts, definitions, and important facts about this topic.
        
        Format your response as a JSON array where each flashcard has:
        - "front": The question or term (keep it concise)
        - "back": The answer or definition (detailed but clear)
        - "difficulty": "easy", "medium", or "hard"
        - "tags": Array of relevant tags for categorization
        
        Make sure the flashcards are educational, accurate, and cover different aspects of the topic.
        
        Example format:
        [
          {
            "front": "What is photosynthesis?",
            "back": "The process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
            "difficulty": "medium",
            "tags": ["biology", "plants", "energy"]
          }
        ]
        
        Return only the JSON array, no additional text.`;

    // Use LLM factory with provider selection
    const result = await llmService.generateContent(prompt, {
      provider: provider,
      model: model,
    });

    if (!result.success) {
      logger.llm.logRequestError(
        requestId,
        "/api/flashcard/create",
        new Error(result.error || "Failed to generate flashcard content"),
        {
          userId,
          keyword,
          title,
          provider,
          model,
        }
      );
      throw new Error(result.error || "Failed to generate flashcard content");
    }

    const generatedText = result.data.content;

    // Parse the generated flashcards
    let cards = [];
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      logger.llm.logRequestError(
        requestId,
        "/api/flashcard/create",
        parseError,
        {
          userId,
          keyword,
          title,
          provider,
          model,
          step: "json_parsing",
          generatedText: generatedText?.substring(0, 200),
        }
      );
      return res.status(500).json({
        success: false,
        message: "Failed to parse generated flashcards",
      });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title, Flashcard);

    // Create flashcard set
    const newFlashcard = new Flashcard({
      userId,
      keyword,
      title,
      slug,
      content: generatedText,
      cards,
      tokens: {
        prompt: prompt.length,
        completion: generatedText.length,
        total: prompt.length + generatedText.length,
      },
      isPublic: isPublic ?? false, // Default to false for backward compatibility
    });

    await newFlashcard.save();

    const duration = Date.now() - startTime;

    // Log successful flashcard creation
    logger.llm.logRequestSuccess(
      requestId,
      "/api/flashcard/create",
      {
        flashcardId: newFlashcard._id,
        slug,
        keyword,
        title,
        cardsCount: cards.length,
        contentLength: generatedText?.length,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: "Flashcard set created successfully",
      flashcardId: newFlashcard._id,
      slug: slug,
      cards: cards,
      isPublic: newFlashcard.isPublic,
    });
  } catch (error) {
    // Log flashcard creation error with context
    logger.llm.logRequestError(requestId, "/api/flashcard/create", error, {
      userId: req.body.userId,
      keyword: req.body.keyword,
      title: req.body.title,
      provider: req.body.provider,
      model: req.body.model,
      duration: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      message: "Failed to create flashcard set",
    });
  }
});

//GET USER FLASHCARDS
app.get("/api/flashcards", async (req, res) => {
  try {
    const { userId, page = 1, limit = 10, visibility = "all" } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // Build query based on visibility filter
    const query = { userId };
    if (visibility === "public") {
      query.isPublic = true;
    } else if (visibility === "private") {
      query.isPublic = false;
    }
    // 'all' means no additional filter

    const skip = (page - 1) * limit;
    const flashcards = await Flashcard.find(query)
      .select(
        "title keyword slug createdAt cards viewCount isPublic forkCount forkedFrom ownerName"
      )
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Flashcard.countDocuments(query);

    // Add card count to each flashcard
    const flashcardsWithCount = flashcards.map((flashcard) => ({
      ...flashcard.toObject(),
      cardCount: flashcard.cards.length,
    }));

    res.json({
      success: true,
      flashcards: flashcardsWithCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error(`Get flashcards error: ${error.message}`, {
      error: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch flashcards",
    });
  }
});

//GET FLASHCARD BY SLUG
app.get("/api/flashcard/:slug", optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const flashcard = await Flashcard.findOne({ slug });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: "Flashcard set not found",
      });
    }

    // Check access control: content must be public OR user must be the owner
    const isOwner = req.user && flashcard.userId === req.user._id.toString();
    const isPublic = flashcard.isPublic === true;

    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This content is private",
      });
    }

    // Update view count and last visited
    flashcard.viewCount += 1;
    flashcard.lastVisitedAt = new Date();
    await flashcard.save();

    logger.info(`Flashcard accessed by slug: ${slug}`);
    res.json({
      success: true,
      flashcard: flashcard,
    });
  } catch (error) {
    logger.error(`Get flashcard by slug error: ${error.message}`, {
      error: error.stack,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch flashcard set",
    });
  }
});

//DELETE FLASHCARD
app.delete("/api/flashcard/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const flashcard = await Flashcard.findOne({ slug, userId });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: "Flashcard set not found or unauthorized",
      });
    }

    await Flashcard.deleteOne({ _id: flashcard._id });

    logger.info(`Flashcard deleted: ${flashcard._id} (${slug})`);

    res.json({
      success: true,
      message: "Flashcard set deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete flashcard error: ${error.message}`, {
      error: error.stack,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete flashcard set",
    });
  }
});



// DOCUMENT PROCESSING ENDPOINTS

// Upload and extract document
app.post(
  "/api/document/upload",
  requireAuth,
  uploadSingle,
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const userId = req.user._id.toString();
      const file = req.file;

      logger.info(
        `Document upload started: ${file.originalname} by user ${userId}`
      );

      // Determine file type from mimetype
      let fileType;
      if (file.mimetype === "application/pdf") {
        fileType = "pdf";
      } else if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        fileType = "docx";
      } else if (file.mimetype === "text/plain") {
        fileType = "txt";
      } else {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type",
        });
      }

      // Trigger document extraction with options object
      const result = await extractDocument({
        filePath: file.path,
        fileType: fileType,
        userId: userId,
        filename: file.originalname,
        fileSize: file.size,
      });

      res.json({
        success: true,
        processingId: result.processingId,
        status: result.status,
        message: "Document uploaded successfully and extraction started",
      });
    } catch (error) {
      logger.error(`Document upload error: ${error.message}`, {
        error: error.stack,
      });
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload document",
      });
    }
  }
);

// Extract text from URL
app.post("/api/document/extract-url", requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.user._id.toString();

    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Validate URL format (HTTP/HTTPS only)
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format. Only HTTP and HTTPS URLs are supported",
      });
    }

    logger.info(`URL extraction started: ${url} by user ${userId}`);

    // Trigger URL extraction using extractDocument
    const result = await extractDocument({
      url: url,
      fileType: "url",
      userId: userId,
      filename: new URL(url).hostname,
    });

    res.json({
      success: true,
      processingId: result.processingId,
      status: result.status,
      message: "URL extraction started",
    });
  } catch (error) {
    logger.error(`URL extraction error: ${error.message}`, {
      error: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Failed to extract from URL",
    });
  }
});

// Get document processing status
app.get("/api/document/status/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    // Find the processing record
    const processing = await DocumentProcessing.findById(id);

    if (!processing) {
      return res.status(404).json({
        success: false,
        message: "Processing record not found",
      });
    }

    // Verify user ownership
    if (processing.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to processing record",
      });
    }

    res.json({
      success: true,
      status: processing.extractionStatus,
      preview: processing.extractedTextPreview,
      textLength: processing.extractedTextLength,
      errorMessage: processing.errorMessage,
      filename: processing.filename,
      fileType: processing.fileType,
    });
  } catch (error) {
    logger.error(`Get status error: ${error.message}`, { error: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to get processing status",
    });
  }
});

// Get full extracted text
app.get("/api/document/text/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    // Find the processing record
    const processing = await DocumentProcessing.findById(id);

    if (!processing) {
      return res.status(404).json({
        success: false,
        message: "Processing record not found",
      });
    }

    // Verify user ownership
    if (processing.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to processing record",
      });
    }

    // Check if extraction is complete
    if (processing.extractionStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: `Extraction not complete. Current status: ${processing.extractionStatus}`,
      });
    }

    res.json({
      success: true,
      text: processing.extractedText,
      filename: processing.filename,
      fileType: processing.fileType,
    });
  } catch (error) {
    logger.error(`Get text error: ${error.message}`, { error: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to get extracted text",
    });
  }
});

// CONTENT GENERATION FROM DOCUMENTS

// Generate course from document
app.post("/api/course/from-document", requireAuth, async (req, res) => {
  const { processingId, text, mainTopic, type, lang, isPublic } = req.body;
  const userId = req.user._id.toString();

  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  logger.llm.logRequestStart(
    requestId,
    "/api/course/from-document",
    {
      hasProcessingId: !!processingId,
      hasDirectText: !!text,
      mainTopic,
      type,
    },
    userId,
    "document-generation"
  );

  try {
    let extractedText = text;
    let sourceDocument = null;

    // If processing ID provided, retrieve extracted text
    if (processingId && !text) {
      const processing = await DocumentProcessing.findById(processingId);

      if (!processing) {
        return res.status(404).json({
          success: false,
          message: "Processing record not found",
        });
      }

      // Verify user ownership
      if (processing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to processing record",
        });
      }

      // Check if extraction is complete
      if (processing.extractionStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: `Extraction not complete. Current status: ${processing.extractionStatus}`,
        });
      }

      extractedText = processing.extractedText;
      sourceDocument = {
        processingId: processing._id,
        filename: processing.filename,
        extractedFrom: processing.fileType,
      };
    }

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "Either processingId or text must be provided",
      });
    }

    // Generate course content using LLM
    const prompt = `Create a comprehensive educational course based on the following content. 
Structure it with clear sections, explanations, and examples.

Topic: ${mainTopic || "General"}
Type: ${type || "Course"}

Content:
${extractedText}

Please create a well-structured course with:
- Clear section headings
- Detailed explanations
- Practical examples where applicable
- Summary points

Format the response in markdown.`;

    const result = await llmService.generateContent(prompt, {
      temperature: 0.7,
    });

    if (!result.success) {
      logger.llm.logRequestError(
        requestId,
        "/api/course/from-document",
        new Error(result.error.message),
        {
          userId,
          mainTopic,
          hasSourceDocument: !!sourceDocument,
        }
      );

      return res.status(500).json({
        success: false,
        message: result.error.message || "Failed to generate course",
      });
    }

    const courseContent = result.data.content;

    // Get course photo from Unsplash
    let photo = null;
    try {
      const unsplashResult = await unsplash.search.getPhotos({
        query: mainTopic || "education",
        page: 1,
        perPage: 1,
        orientation: "landscape",
      });

      const firstPhoto = safeGetFirst(unsplashResult, "response.results");
      photo = safeGet(firstPhoto, "urls.regular", null);
    } catch (unsplashError) {
      logger.warn(
        `Unsplash API error for course from document: ${unsplashError.message}`
      );
    }

    // Generate slug
    const title = extractTitleFromContent(courseContent, mainTopic || "Course");
    const slug = await generateUniqueSlug(title, Course);

    // Create course
    const newCourse = new Course({
      user: userId,
      content: courseContent,
      type: type || "Course",
      mainTopic: mainTopic || "General",
      slug,
      photo,
      isPublic: isPublic ?? false,
      sourceDocument,
    });

    await newCourse.save();

    // Save language
    if (lang) {
      const newLang = new Language({ course: newCourse._id, lang });
      await newLang.save();
    }

    const duration = Date.now() - startTime;

    logger.llm.logRequestSuccess(
      requestId,
      "/api/course/from-document",
      {
        courseId: newCourse._id,
        slug,
        hasPhoto: !!photo,
        hasSourceDocument: !!sourceDocument,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: "Course created successfully from document",
      courseId: newCourse._id,
      slug,
      isPublic: newCourse.isPublic,
    });
  } catch (error) {
    logger.llm.logRequestError(requestId, "/api/course/from-document", error, {
      userId,
      mainTopic,
      hasProcessingId: !!processingId,
      hasText: !!text,
    });

    res.status(500).json({
      success: false,
      message: "Failed to create course from document",
    });
  }
});

// Quiz from document route is now in routes/quizRoutes.js

// Generate flashcards from document
app.post("/api/flashcard/from-document", requireAuth, async (req, res) => {
  const { processingId, text, title, keyword } = req.body;
  const userId = req.user._id.toString();

  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  logger.llm.logRequestStart(
    requestId,
    "/api/flashcard/from-document",
    {
      hasProcessingId: !!processingId,
      hasDirectText: !!text,
      title,
      keyword,
    },
    userId,
    "document-generation"
  );

  try {
    let extractedText = text;
    let sourceDocument = null;

    // If processing ID provided, retrieve extracted text
    if (processingId && !text) {
      const processing = await DocumentProcessing.findById(processingId);

      if (!processing) {
        return res.status(404).json({
          success: false,
          message: "Processing record not found",
        });
      }

      if (processing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to processing record",
        });
      }

      if (processing.extractionStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: `Extraction not complete. Current status: ${processing.extractionStatus}`,
        });
      }

      extractedText = processing.extractedText;
      sourceDocument = {
        processingId: processing._id,
        filename: processing.filename,
        extractedFrom: processing.fileType,
      };
    }

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "Either processingId or text must be provided",
      });
    }

    // Generate flashcards using LLM
    const prompt = `Create educational flashcards based on the following content.

Title: ${title || "Flashcards"}
Topic: ${keyword || "General"}

Content:
${extractedText}

Generate 10-15 flashcard pairs with:
- Front: A clear question or term
- Back: A concise answer or definition

Focus on key concepts, important terms, and essential information.

Format as JSON array with structure:
[
  {
    "front": "Question or term",
    "back": "Answer or definition"
  }
]`;

    const result = await llmService.generateContent(prompt, {
      temperature: 0.7,
    });

    if (!result.success) {
      logger.llm.logRequestError(
        requestId,
        "/api/flashcard/from-document",
        new Error(result.error.message),
        {
          userId,
          title,
          hasSourceDocument: !!sourceDocument,
        }
      );

      return res.status(500).json({
        success: false,
        message: result.error.message || "Failed to generate flashcards",
      });
    }

    // Parse flashcard content
    let flashcardData;
    try {
      const content = result.data.content;
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      flashcardData = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error(`Failed to parse flashcard JSON: ${parseError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to parse generated flashcard content",
      });
    }

    // Generate slug
    const slug = await generateUniqueSlug(title || "Flashcards", Flashcard);

    // Create flashcard set
    const newFlashcard = new Flashcard({
      userId,
      title: title || "Flashcards",
      keyword: keyword || "General",
      slug,
      cards: flashcardData,
      sourceDocument,
    });

    await newFlashcard.save();

    const duration = Date.now() - startTime;

    logger.llm.logRequestSuccess(
      requestId,
      "/api/flashcard/from-document",
      {
        flashcardId: newFlashcard._id,
        slug,
        cardCount: flashcardData.length,
        hasSourceDocument: !!sourceDocument,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: "Flashcards created successfully from document",
      flashcardId: newFlashcard._id,
      slug,
    });
  } catch (error) {
    logger.llm.logRequestError(
      requestId,
      "/api/flashcard/from-document",
      error,
      {
        userId,
        title,
        hasProcessingId: !!processingId,
        hasText: !!text,
      }
    );

    res.status(500).json({
      success: false,
      message: "Failed to create flashcards from document",
    });
  }
});



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
    if (consistencyResults.orphanedExams > 0 || consistencyResults.orphanedLanguages > 0) {
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
