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
  Notes,
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

//GET NOTES
app.post("/api/getnotes", async (req, res) => {
  const { course } = req.body;
  try {
    const existingNotes = await Notes.findOne({ course: course });
    if (userDetails.method === "stripe") {
      const subscription = await stripe.subscriptions.retrieve(
        userDetails.subscriberId
      );

      res.json({ session: subscription, method: userDetails.method });
    } else if (userDetails.method === "paypal") {
      const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
      const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
      const auth = Buffer.from(
        PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY
      ).toString("base64");
      const response = await fetch(
        `https://api-m.paypal.com/v1/billing/subscriptions/${userDetails.subscription}`,
        {
          headers: {
            Authorization: "Basic " + auth,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const session = await response.json();
      res.json({ session: session, method: userDetails.method });
    } else if (userDetails.method === "flutterwave") {
      const payload = { email: email };
      if (!flw) {
        res.status(500).json({ success: false, message: "Flutterwave not configured" });
        return;
      }
      if (!flw) {
        res.status(500).json({ success: false, message: "Flutterwave not configured" });
        return;
      }
      const response = await flw.Subscription.get(payload);
      res.json({ session: response["data"][0], method: userDetails.method });
    } else if (userDetails.method === "paystack") {
      const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
      const response = await axios.get(
        `https://api.paystack.co/subscription/${userDetails.subscriberId}`,
        {
          headers: {
            Authorization: authorization,
          },
        }
      );

      let subscriptionDetails = null;
      subscriptionDetails = {
        subscription_code: response.data.data.subscription_code,
        createdAt: response.data.data.createdAt,
        updatedAt: response.data.data.updatedAt,
        customer_code: userDetails.subscription,
        email_token: response.data.data.email_token,
      };

      res.json({ session: subscriptionDetails, method: userDetails.method });
    } else {
      const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
      const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
      const SUBSCRIPTION_ID = userDetails.subscription;

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        auth: {
          username: YOUR_KEY_ID,
          password: YOUR_KEY_SECRET,
        },
      };

      axios
        .get(
          `https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`,
          config
        )
        .then((response) => {
          res.json({ session: response.data, method: userDetails.method });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  } catch (error) {
    console.log("Error", error);
  }
});

app.post("/api/downloadreceipt", async (req, res) => {
  const { html, email } = req.body;

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
    subject: "Subscription Receipt",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to send receipt" });
    } else {
      res.json({ success: true, message: "Receipt sent to your mail" });
    }
  });
});

//SEND RECEIPT
app.post("/api/sendreceipt", async (req, res) => {
  const { html, email, plan, subscriberId, user, method, subscription } =
    req.body;
  console.log(subscriberId, subscription);
  const existingSubscription = await Subscription.findOne({ user: user });
  if (existingSubscription) {
    //DO NOTHING
  } else {
    const newSub = new Subscription({
      user,
      subscription,
      subscriberId,
      plan,
      method,
    });
    await newSub.save();
    console.log(newSub);
  }

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
    subject: "Subscription Payment",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to send receipt" });
    } else {
      res.json({ success: true, message: "Receipt sent to your mail" });
    }
  });
});

//PAYPAL WEBHOOKS
app.post("/api/paypalwebhooks", async (req, res) => {
  const body = req.body;
  const event_type = body.event_type;

  switch (event_type) {
    case "BILLING.SUBSCRIPTION.CANCELLED":
      const id = body["resource"]["id"];
      updateSubsciption(id, "Cancelled");
      break;
    case "BILLING.SUBSCRIPTION.EXPIRED":
      const id2 = body["resource"]["id"];
      updateSubsciption(id2, "Expired");
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      const id3 = body["resource"]["id"];
      updateSubsciption(id3, "Suspended");
      break;
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      const id4 = body["resource"]["id"];
      updateSubsciption(id4, "Disabled Due To Payment Failure");
      break;
    case "PAYMENT.SALE.COMPLETED":
      const id5 = body["resource"]["billing_agreement_id"];
      sendRenewEmail(id5);
      break;

    default:
    //DO NOTHING
  }
});

//SEND RENEW EMAIL
async function sendRenewEmail(id) {
  try {
    const subscriptionDetails = await Subscription.findOne({
      subscription: id,
    });
    const userId = subscriptionDetails.user;
    const userDetails = await User.findOne({ _id: userId });

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

    const mailOptions = {
      from: process.env.EMAIL,
      to: userDetails.email,
      subject: `${userDetails.mName} Your Subscription Plan Has Been Renewed`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
            <html lang="en">
            
              <head></head>
             <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Renewed<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
             </div>
            
             <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                  <tr style="width:100%">
                    <td>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                        <tbody>
                          <tr>
                            <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Renewed</h1>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Renewed.</p>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                      </td>
                  </tr>
                </table>
              </body>
            
            </html>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error", error);
  }
}

//UPDATE SUBSCRIPTION DETIALS
async function updateSubsciption(id, subject) {
  try {
    const subscriptionDetails = await Subscription.findOne({
      subscription: id,
    });
    const userId = subscriptionDetails.user;

    await User.findOneAndUpdate({ _id: userId }, { $set: { type: "free" } });

    const userDetails = await User.findOne({ _id: userId });
    await Subscription.findOneAndDelete({ subscription: id });

    sendCancelEmail(userDetails.email, userDetails.mName, subject);
  } catch (error) {
    console.log("Error", error);
  }
}

//SEND CANCEL EMAIL
async function sendCancelEmail(email, name, subject) {
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

  const Reactivate = process.env.WEBSITE_URL + "/pricing";

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: `${name} Your Subscription Plan Has Been ${subject}`,
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
        <html lang="en">
        
          <head></head>
         <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription ${subject}<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
         </div>
        
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
              <tr style="width:100%">
                <td>
                  <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                    <tbody>
                      <tr>
                        <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                      </tr>
                    </tbody>
                  </table>
                  <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription ${subject}</h1>
                  <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${name}, your subscription plan has been ${subject}. Reactivate your plan by clicking on the button below.</p>
                  <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                       <tbody>
                          <tr>
                            <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                          </tr>
                        </tbody>
                  </table>
                  <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                  </td>
              </tr>
            </table>
          </body>
        
        </html>`,
  };

  await transporter.sendMail(mailOptions);
}

//CANCEL PAYPAL SUBSCRIPTION
app.post("/api/paypalcancel", async (req, res) => {
  const { id, email } = req.body;

  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
  const auth = Buffer.from(
    PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY
  ).toString("base64");
  await fetch(
    `https://api-m.paypal.com/v1/billing/subscriptions/${id}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reason: "Not satisfied with the service" }),
    }
  ).then(async (resp) => {
    try {
      const subscriptionDetails = await Subscription.findOne({
        subscriberId: email,
      });
      const userId = subscriptionDetails.user;

      await User.findOneAndUpdate({ _id: userId }, { $set: { type: "free" } });

      const userDetails = await User.findOne({ _id: userId });
      await Subscription.findOneAndDelete({ subscription: id });

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

      const Reactivate = process.env.WEBSITE_URL + "/pricing";

      const mailOptions = {
        from: process.env.EMAIL,
        to: userDetails.email,
        subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "" });
    } catch (error) {
      console.log("Error", error);
    }
  });
});

//UPDATE SUBSCRIPTION
app.post("/api/paypalupdate", async (req, res) => {
  const { id, idPlan } = req.body;

  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
  const auth = Buffer.from(
    PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY
  ).toString("base64");

  try {
    const response = await fetch(
      `https://api-m.paypal.com/v1/billing/subscriptions/${id}/revise`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: idPlan,
          application_context: {
            brand_name: process.env.COMPANY,
            locale: "en-US",
            payment_method: {
              payer_selected: "PAYPAL",
              payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
            },
            return_url: `${process.env.WEBSITE_URL}/payment-success/${idPlan}`,
            cancel_url: `${process.env.WEBSITE_URL}/payment-failed`,
          },
        }),
      }
    );
    const session = await response.json();
    res.send(session);
  } catch (error) {
    console.log("Error", error);
  }
});

//UPDATE SUBSCRIPTION AND USER DETAILS
app.post("/api/paypalupdateuser", async (req, res) => {
  const { id, mName, email, user, plan } = req.body;

  await Subscription.findOneAndUpdate(
    { subscription: id },
    { $set: { plan: plan } }
  ).then(async (r) => {
    await User.findOneAndUpdate({ _id: user }, { $set: { type: plan } }).then(
      async (ress) => {
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

        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: `${mName} Your Subscription Plan Has Been Modifed`,
          html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
    
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Modifed<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
    
    <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Modifed</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${mName}, your subscription plan has been Modifed.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
    
                </html>`,
        };

        await transporter.sendMail(mailOptions);
      }
    );
  });
});

//CREATE RAZORPAY SUBSCRIPTION
app.post("/api/razorpaycreate", async (req, res) => {
  const { plan, email, fullAddress } = req.body;
  try {
    const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    const requestBody = {
      plan_id: plan,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        notes_key_1: fullAddress,
      },
      notify_info: {
        notify_email: email,
      },
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: YOUR_KEY_ID,
        password: YOUR_KEY_SECRET,
      },
    };

    const requestData = JSON.stringify(requestBody);

    axios
      .post("https://api.razorpay.com/v1/subscriptions", requestData, config)
      .then((response) => {
        res.send(response.data);
      })
      .catch((error) => {
        console.log("Error", error);
      });
  } catch (error) {
    console.log("Error", error);
  }
});

//GET RAZORPAY SUBSCRIPTION DETAILS
app.post("/api/razorapydetails", async (req, res) => {
  const { subscriberId, uid, plan } = req.body;

  let cost = 0;
  if (plan === process.env.MONTH_TYPE) {
    cost = process.env.MONTH_COST;
  } else {
    cost = process.env.YEAR_COST;
  }
  cost = cost / 4;

  await Admin.findOneAndUpdate({ type: "main" }, { $inc: { total: cost } });

  await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
    .then(async (result) => {
      const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
      const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
      const SUBSCRIPTION_ID = subscriberId;

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        auth: {
          username: YOUR_KEY_ID,
          password: YOUR_KEY_SECRET,
        },
      };

      axios
        .get(
          `https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`,
          config
        )
        .then((response) => {
          res.send(response.data);
        })
        .catch((error) => {
          //DO NOTHING
        });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

//RAZORPAY PENDING
app.post("/api/razorapypending", async (req, res) => {
  const { sub } = req.body;

  const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const SUBSCRIPTION_ID = sub;

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: YOUR_KEY_ID,
      password: YOUR_KEY_SECRET,
    },
  };

  axios
    .get(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`, config)
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      console.log("Error", error);
    });
});

//RAZORPAY CANCEL SUBSCRIPTION
app.post("/api/razorpaycancel", async (req, res) => {
  const { id, email } = req.body;

  const YOUR_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const YOUR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const SUBSCRIPTION_ID = id;

  const requestBody = {
    cancel_at_cycle_end: 0,
  };

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: YOUR_KEY_ID,
      password: YOUR_KEY_SECRET,
    },
  };

  axios
    .post(
      `https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}/cancel`,
      requestBody,
      config
    )
    .then(async (resp) => {
      try {
        const subscriptionDetails = await Subscription.findOne({
          subscriberId: email,
        });
        const userId = subscriptionDetails.user;

        await User.findOneAndUpdate(
          { _id: userId },
          { $set: { type: "free" } }
        );

        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscription: id });

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

        const Reactivate = process.env.WEBSITE_URL + "/pricing";

        const mailOptions = {
          from: process.env.EMAIL,
          to: userDetails.email,
          subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
          html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                    <html lang="en">
                    
                      <head></head>
                     <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                     </div>
                    
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                          <tr style="width:100%">
                            <td>
                              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                                <tbody>
                                  <tr>
                                    <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                                  </tr>
                                </tbody>
                              </table>
                              <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                              <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                                   <tbody>
                                      <tr>
                                        <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                      </tr>
                                    </tbody>
                              </table>
                              <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                              </td>
                          </tr>
                        </table>
                      </body>
                    
                    </html>`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "" });
      } catch (error) {
        console.log("Error", error);
      }
    })
    .catch((error) => {
      console.log("Error", error);
    });
});

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

//STRIPE PAYMENT
app.post("/api/stripepayment", async (req, res) => {
  const { planId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      success_url: `${process.env.WEBSITE_URL}/payment-success/${planId}`,
      cancel_url: `${process.env.WEBSITE_URL}/payment-failed`,
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: "subscription",
    });

    res.json({ url: session.url, id: session.id });
  } catch (e) {
    console.log("Error", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/stripedetails", async (req, res) => {
  const { subscriberId, uid, plan } = req.body;

  let cost = 0;
  if (plan === process.env.MONTH_TYPE) {
    cost = process.env.MONTH_COST;
  } else {
    cost = process.env.YEAR_COST;
  }
  cost = cost / 4;

  await Admin.findOneAndUpdate({ type: "main" }, { $inc: { total: cost } });

  await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
    .then(async (result) => {
      const session = await stripe.checkout.sessions.retrieve(subscriberId);
      res.send(session);
    })
    .catch((error) => {
      console.log("Error", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

app.post("/api/stripecancel", async (req, res) => {
  const { id, email } = req.body;

  const subscription = await stripe.subscriptions.cancel(id);

  try {
    const subscriptionDetails = await Subscription.findOne({
      subscriberId: email,
    });
    const userId = subscriptionDetails.user;

    await User.findOneAndUpdate({ _id: userId }, { $set: { type: "free" } });

    const userDetails = await User.findOne({ _id: userId });
    await Subscription.findOneAndDelete({ subscriberId: id });

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

    const Reactivate = process.env.WEBSITE_URL + "/pricing";

    const mailOptions = {
      from: process.env.EMAIL,
      to: userDetails.email,
      subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>

<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "" });
  } catch (error) {
    console.log("Error", error);
  }
});

//PAYSTACK PAYMENT
app.post("/api/paystackpayment", async (req, res) => {
  const { planId, amountInZar, email } = req.body;
  try {
    const data = {
      email: email,
      amount: amountInZar,
      plan: planId,
    };

    axios
      .post("https://api.paystack.co/transaction/initialize", data, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        if (response.data.status) {
          const authorizationUrl = response.data.data.authorization_url;
          res.json({ url: authorizationUrl });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
      })
      .catch((error) => {
        res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (e) {
    console.log("Error", e);
    res.status(500).json({ error: e.message });
  }
});

//PAYSTACK GET DETAIL
app.post("/api/paystackfetch", async (req, res) => {
  const { email, uid, plan } = req.body;
  try {
    const searchEmail = email;
    const url = "https://api.paystack.co/subscription";
    const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;

    axios
      .get(url, {
        headers: {
          Authorization: authorization,
        },
      })
      .then(async (response) => {
        const jsonData = response.data;
        let subscriptionDetails = null;
        jsonData.data.forEach((subscription) => {
          if (subscription.customer.email === searchEmail) {
            subscriptionDetails = {
              subscription_code: subscription.subscription_code,
              createdAt: subscription.createdAt,
              updatedAt: subscription.updatedAt,
              customer_code: subscription.customer.customer_code,
            };
          }
        });

        if (subscriptionDetails) {
          let cost = 0;
          if (plan === process.env.MONTH_TYPE) {
            cost = process.env.MONTH_COST;
          } else {
            cost = process.env.YEAR_COST;
          }
          cost = cost / 4;

          await Admin.findOneAndUpdate(
            { type: "main" },
            { $inc: { total: cost } }
          );

          await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
            .then(async (result) => {
              res.json({ details: subscriptionDetails });
            })
            .catch((error) => {
              console.log("Error", error);
              res
                .status(500)
                .json({ success: false, message: "Internal server error" });
            });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
      })
      .catch((error) => {
        console.log("Error", error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (e) {
    console.log("Error", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PAYSTACK PAYMENT
app.post("/api/paystackcancel", async (req, res) => {
  const { code, token, email } = req.body;

  const url = "https://api.paystack.co/subscription/disable";
  const authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
  const contentType = "application/json";
  const data = {
    code: code,
    token: token,
  };

  axios
    .post(url, data, {
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
      },
    })
    .then(async (response) => {
      const subscriptionDetails = await Subscription.findOne({
        subscriberId: email,
      });
      const userId = subscriptionDetails.user;

      await User.findOneAndUpdate({ _id: userId }, { $set: { type: "free" } });

      const userDetails = await User.findOne({ _id: userId });
      await Subscription.findOneAndDelete({ subscriberId: code });

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

      const Reactivate = process.env.WEBSITE_URL + "/pricing";

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
                  <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                </html>`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "" });
    });
});

//FLUTTERWAVE PAYMENT
app.post("/api/flutterwavecancel", async (req, res) => {
  const { code, token, email } = req.body;

  if (!flw) {
    res.status(500).json({ success: false, message: "Flutterwave not configured" });
    return;
  }

  if (!flw) {
    res.status(500).json({ success: false, message: "Flutterwave not configured" });
    return;
  }

  const payload = { id: code };
  const response = await flw.Subscription.cancel(payload);
  if (response) {
    const subscriptionDetails = await Subscription.findOne({
      subscriberId: email,
    });
    const userId = subscriptionDetails.user;

    await User.findOneAndUpdate({ _id: userId }, { $set: { type: "free" } });

    const userDetails = await User.findOne({ _id: userId });
    await Subscription.findOneAndDelete({ subscriberId: token });

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

    const Reactivate = process.env.WEBSITE_URL + "/pricing";

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Cancelled<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
                
<body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Cancelled</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${userDetails.mName}, your subscription plan has been Cancelled. Reactivate your plan by clicking on the button below.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                               <tbody>
                                  <tr>
                                    <td><a href="${Reactivate}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #a855f7;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reactivate</span></a></td>
                                  </tr>
                                </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "" });
  } else {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//FLUTTERWAVE GET DETAILS
app.post("/api/flutterdetails", async (req, res) => {
  const { email, uid, plan } = req.body;
  try {
    let cost = 0;
    if (plan === process.env.MONTH_TYPE) {
      cost = process.env.MONTH_COST;
    } else {
      cost = process.env.YEAR_COST;
    }
    cost = cost / 4;

    await Admin.findOneAndUpdate({ type: "main" }, { $inc: { total: cost } });

    await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
      .then(async (result) => {
        const payload = { email: email };
        if (!flw) {
          res.status(500).json({ success: false, message: "Flutterwave not configured" });
          return;
        }
        if (!flw) {
          res.status(500).json({ success: false, message: "Flutterwave not configured" });
          return;
        }
        const response = await flw.Subscription.get(payload);

        res.send(response["data"][0]);
      })
      .catch((error) => {
        console.log("Error", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET NOTES
app.post("/api/getnotes", async (req, res) => {
  const { course } = req.body;
  try {
    const existingNotes = await Notes.findOne({ course: course });
    if (existingNotes) {
      res.json({ success: true, message: existingNotes.notes });
    } else {
      res.json({ success: false, message: "" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//SAVE NOTES
app.post("/api/savenotes", async (req, res) => {
  const { course, notes } = req.body;
  try {
    const existingNotes = await Notes.findOne({ course: course });

    if (existingNotes) {
      await Notes.findOneAndUpdate(
        { course: course },
        { $set: { notes: notes } }
      );
      res.json({ success: true, message: "Notes updated successfully" });
    } else {
      const newNotes = new Notes({ course: course, notes: notes });
      await newNotes.save();
      res.json({ success: true, message: "Notes created successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
        `🧹 Scheduled cleanup job initialized (runs every ${
          CLEANUP_INTERVAL / 1000 / 60
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

//QUIZ ENDPOINTS

//CREATE QUIZ
app.post("/api/quiz/create", requireAuth, async (req, res) => {
  // Generate request ID for logging correlation
  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  try {
    const {
      userId,
      keyword,
      title,
      format,
      provider,
      model,
      questionAndAnswers,
      isPublic,
    } = req.body;

    // Log request start
    logger.llm.logRequestStart(
      requestId,
      "/api/quiz/create",
      {
        keyword,
        title,
        format,
        provider,
        model,
      },
      userId,
      provider
    );

    if (!userId || !keyword || !title) {
      return res.status(400).json({
        success: false,
        message: "userId, keyword, and title are required",
      });
    }

    // Generate quiz content using AI
    const quizPrompt = `Create a comprehensive quiz about "${keyword}" with the title "${title}". 
        Format: ${format || "mixed"}
        
        Generate 15-20 multiple choice questions in this markdown format:
        # Question text here?
        - Wrong answer option
        -* Correct answer option (marked with *)
        - Wrong answer option
        - Wrong answer option
        ## Explanation of the correct answer here
        
        Make the questions challenging and cover various aspects of the topic.`;

    // Use LLM factory with provider selection
    const result = await llmService.generateContent(quizPrompt, {
      provider: provider,
      model: model,
    });

    if (!result.success) {
      logger.llm.logRequestError(
        requestId,
        "/api/quiz/create",
        new Error(result.error || "Failed to generate quiz content"),
        {
          userId,
          keyword,
          title,
          provider,
          model,
        }
      );
      throw new Error(result.error || "Failed to generate quiz content");
    }

    const quizContent = result.data.content;

    // Generate unique slug
    const baseSlug = generateSlug(`${title}-${Date.now()}`);
    const slug = await generateUniqueSlug(baseSlug, Quiz);

    // Create quiz
    const newQuiz = new Quiz({
      userId,
      keyword,
      title,
      slug,
      format: format || "mixed",
      content: quizContent,
      tokens: {
        prompt: quizPrompt.length,
        completion: quizContent.length,
        total: quizPrompt.length + quizContent.length,
      },
      questionAndAnswers: questionAndAnswers || [],
      viewCount: 0,
      lastVisitedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: isPublic ?? false, // Default to false for backward compatibility
    });

    await newQuiz.save();

    const duration = Date.now() - startTime;

    // Log successful quiz creation
    logger.llm.logRequestSuccess(
      requestId,
      "/api/quiz/create",
      {
        quizId: newQuiz._id,
        slug,
        keyword,
        title,
        contentLength: quizContent?.length,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: "Quiz created successfully",
      quiz: {
        _id: newQuiz._id,
        slug: newQuiz.slug,
        title: newQuiz.title,
        keyword: newQuiz.keyword,
        isPublic: newQuiz.isPublic,
      },
    });
  } catch (error) {
    // Log quiz creation error with context
    logger.llm.logRequestError(requestId, "/api/quiz/create", error, {
      userId: req.body.userId,
      keyword: req.body.keyword,
      title: req.body.title,
      provider: req.body.provider,
      model: req.body.model,
      duration: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      message: "Failed to create quiz",
    });
  }
});

//GET USER QUIZZES
app.get("/api/quizzes", async (req, res) => {
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
    const totalCount = await Quiz.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const quizzes = await Quiz.find(query)
      .select(
        "_id userId keyword title slug format tokens viewCount lastVisitedAt createdAt updatedAt isPublic forkCount forkedFrom ownerName"
      )
      .sort({ updatedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: quizzes,
      totalCount,
      totalPages,
      currPage: parseInt(page),
      perPage: parseInt(limit),
    });
  } catch (error) {
    logger.error(`Get quizzes error: ${error.message}`, { error: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch quizzes",
    });
  }
});

//GET QUIZ BY SLUG
app.get("/api/quiz/:slug", optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    const quiz = await Quiz.findOne({ slug });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check access control: content must be public OR user must be the owner
    const isOwner = req.user && quiz.userId === req.user._id.toString();
    const isPublic = quiz.isPublic === true;

    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This content is private",
      });
    }

    // Increment view count
    quiz.viewCount += 1;
    quiz.lastVisitedAt = new Date();
    await quiz.save();

    logger.info(`Quiz accessed by slug: ${slug}`);

    res.json({
      success: true,
      quiz: quiz,
    });
  } catch (error) {
    logger.error(`Get quiz by slug error: ${error.message}`, {
      error: error.stack,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch quiz",
    });
  }
});

//GET QUIZ BY ID (Legacy support)
app.get("/api/quiz/id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Increment view count
    quiz.viewCount += 1;
    quiz.lastVisitedAt = new Date();
    await quiz.save();

    // If quiz has slug, suggest redirect
    if (quiz.slug) {
      return res.json({
        success: true,
        quiz: quiz,
        redirect: `/quiz/${quiz.slug}`,
      });
    }

    logger.info(`Quiz accessed by ID: ${id}`);

    res.json({
      success: true,
      quiz: quiz,
    });
  } catch (error) {
    logger.error(`Get quiz by ID error: ${error.message}`, {
      error: error.stack,
      id: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch quiz",
    });
  }
});

//DELETE QUIZ
app.delete("/api/quiz/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const quiz = await Quiz.findOneAndDelete({ slug, userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or unauthorized",
      });
    }

    logger.info(`Quiz deleted: ${quiz._id} (${slug})`);

    res.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete quiz error: ${error.message}`, {
      error: error.stack,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete quiz",
    });
  }
});

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

// Generate quiz from document
app.post("/api/quiz/from-document", requireAuth, async (req, res) => {
  const { processingId, text, title, keyword } = req.body;
  const userId = req.user._id.toString();

  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  logger.llm.logRequestStart(
    requestId,
    "/api/quiz/from-document",
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

    // Check if content is sufficient for quiz generation
    if (extractedText.length < 100) {
      return res.status(422).json({
        success: false,
        message:
          "Insufficient content for quiz generation. Please provide more detailed content.",
      });
    }

    // Generate quiz using LLM
    const prompt = `Create a multiple-choice quiz based on the following content.

Title: ${title || "Quiz"}
Topic: ${keyword || "General"}

Content:
${extractedText}

Generate 5-10 multiple-choice questions with:
- Clear question text
- 4 answer options (A, B, C, D)
- One correct answer
- Brief explanation for the correct answer

Format as JSON array with structure:
[
  {
    "question": "Question text",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Why this is correct"
  }
]`;

    const result = await llmService.generateContent(prompt, {
      temperature: 0.7,
    });

    if (!result.success) {
      logger.llm.logRequestError(
        requestId,
        "/api/quiz/from-document",
        new Error(result.error.message),
        {
          userId,
          title,
          hasSourceDocument: !!sourceDocument,
        }
      );

      return res.status(500).json({
        success: false,
        message: result.error.message || "Failed to generate quiz",
      });
    }

    // Parse quiz content
    let quizData;
    try {
      const content = result.data.content;
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      quizData = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error(`Failed to parse quiz JSON: ${parseError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to parse generated quiz content",
      });
    }

    // Generate slug
    const slug = await generateUniqueSlug(title || "Quiz", Quiz);

    // Create quiz
    const newQuiz = new Quiz({
      userId,
      title: title || "Quiz",
      keyword: keyword || "General",
      slug,
      questions: quizData,
      sourceDocument,
    });

    await newQuiz.save();

    const duration = Date.now() - startTime;

    logger.llm.logRequestSuccess(
      requestId,
      "/api/quiz/from-document",
      {
        quizId: newQuiz._id,
        slug,
        questionCount: quizData.length,
        hasSourceDocument: !!sourceDocument,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: "Quiz created successfully from document",
      quizId: newQuiz._id,
      slug,
    });
  } catch (error) {
    logger.llm.logRequestError(requestId, "/api/quiz/from-document", error, {
      userId,
      title,
      hasProcessingId: !!processingId,
      hasText: !!text,
    });

    res.status(500).json({
      success: false,
      message: "Failed to create quiz from document",
    });
  }
});

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
    if (consistencyResults.orphanedNotes > 0 || consistencyResults.orphanedExams > 0 || consistencyResults.orphanedLanguages > 0) {
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
