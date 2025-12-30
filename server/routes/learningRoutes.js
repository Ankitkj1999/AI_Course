/**
 * Learning Content Routes
 * 
 * This module handles all learning-related routes including:
 * - Quiz management (create, read, delete)
 * - Flashcard operations (create, read, delete)
 * - Guide management (create, read, delete)
 * - AI-powered exam generation
 */

import express from 'express';

const router = express.Router();

// Dependencies will be injected
let requireAuth, optionalAuth, logger, llmService;
let Quiz, Flashcard, Guide, Exam, DocumentProcessing;
let unsplash, safeGet, safeGetFirst;
let generateUniqueSlug, extractTitleFromContent;

// Initialize function to inject dependencies
export function initializeLearningRoutes(dependencies) {
  requireAuth = dependencies.requireAuth;
  optionalAuth = dependencies.optionalAuth;
  logger = dependencies.logger;
  llmService = dependencies.llmService;
  Quiz = dependencies.Quiz;
  Flashcard = dependencies.Flashcard;
  Guide = dependencies.Guide;
  Exam = dependencies.Exam;
  DocumentProcessing = dependencies.DocumentProcessing;
  unsplash = dependencies.unsplash;
  safeGet = dependencies.safeGet;
  safeGetFirst = dependencies.safeGetFirst;
  generateUniqueSlug = dependencies.generateUniqueSlug;
  extractTitleFromContent = dependencies.extractTitleFromContent;
}

export default router;
