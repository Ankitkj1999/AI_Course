import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import DocumentProcessing from '../models/DocumentProcessing.js';
import { scheduleCleanup } from './fileCleanup.js';

/**
 * Extract text from PDF files using LangChain PDFLoader
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<{text: string, metadata: object}>}
 */
export async function extractPDF(filePath) {
    try {
        logger.info(`Starting PDF extraction for file: ${filePath}`);
        
        const loader = new PDFLoader(filePath, {
            splitPages: false // Get all text in one document
        });
        
        const docs = await loader.load();
        
        // Combine all pages into single text
        const text = docs.map(doc => doc.pageContent).join('\n\n');
        
        // Filter out non-text content (binary data, image markers, etc.)
        const cleanedText = text
            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .replace(/\[Image:.*?\]/g, '') // Remove image markers
            .replace(/\[Object:.*?\]/g, '') // Remove object markers
            .trim();
        
        logger.info(`PDF extraction completed. Extracted ${cleanedText.length} characters`);
        
        return {
            text: cleanedText,
            metadata: {
                pageCount: docs.length,
                source: filePath
            }
        };
    } catch (error) {
        logger.error(`PDF extraction failed for ${filePath}: ${error.message}`);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Extract text from DOCX files using LangChain DocxLoader
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<{text: string, metadata: object}>}
 */
export async function extractDOCX(filePath) {
    try {
        logger.info(`Starting DOCX extraction for file: ${filePath}`);
        
        const loader = new DocxLoader(filePath);
        const docs = await loader.load();
        
        // Combine all content, preserving paragraph structure
        const text = docs.map(doc => doc.pageContent).join('\n\n');
        
        logger.info(`DOCX extraction completed. Extracted ${text.length} characters`);
        
        return {
            text: text.trim(),
            metadata: {
                source: filePath,
                paragraphs: docs.length
            }
        };
    } catch (error) {
        logger.error(`DOCX extraction failed for ${filePath}: ${error.message}`);
        throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
}

/**
 * Extract text from plain text files
 * @param {string} filePath - Path to the text file
 * @returns {Promise<{text: string, metadata: object}>}
 */
export async function extractText(filePath) {
    try {
        logger.info(`Starting text extraction for file: ${filePath}`);
        
        // Read text file directly using fs
        const text = await fs.readFile(filePath, 'utf-8');
        
        logger.info(`Text extraction completed. Extracted ${text.length} characters`);
        
        return {
            text: text.trim(),
            metadata: {
                source: filePath
            }
        };
    } catch (error) {
        logger.error(`Text extraction failed for ${filePath}: ${error.message}`);
        throw new Error(`Failed to extract text from file: ${error.message}`);
    }
}

/**
 * Extract text from web URLs using CheerioWebBaseLoader
 * @param {string} url - URL to extract content from
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<{text: string, metadata: object}>}
 */
export async function extractFromURL(url, timeout = 10000) {
    try {
        logger.info(`Starting URL extraction for: ${url}`);
        
        // Validate URL format
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(url)) {
            throw new Error('Invalid URL format. Only HTTP and HTTPS URLs are supported.');
        }
        
        // Create loader with timeout
        const loader = new CheerioWebBaseLoader(url, {
            timeout: timeout
        });
        
        // Set up timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('URL fetch timeout after 10 seconds')), timeout);
        });
        
        // Race between loading and timeout
        const docs = await Promise.race([
            loader.load(),
            timeoutPromise
        ]);
        
        const rawText = docs.map(doc => doc.pageContent).join('\n\n');
        
        // Clean web content - remove navigation, ads, and footer elements
        const cleanedText = cleanWebContent(rawText);
        
        logger.info(`URL extraction completed. Extracted ${cleanedText.length} characters from ${url}`);
        
        return {
            text: cleanedText,
            metadata: {
                source: url,
                extractedAt: new Date().toISOString()
            }
        };
    } catch (error) {
        logger.error(`URL extraction failed for ${url}: ${error.message}`);
        
        if (error.message.includes('timeout')) {
            throw new Error(`URL is inaccessible: Request timed out after 10 seconds`);
        }
        
        throw new Error(`Failed to extract content from URL: ${error.message}`);
    }
}

/**
 * Clean web content by removing navigation, ads, and footer elements
 * @param {string} text - Raw text from web page
 * @returns {string} - Cleaned text
 */
function cleanWebContent(text) {
    // Remove common navigation patterns
    let cleaned = text
        // Remove navigation menu patterns
        .replace(/(?:nav|menu|navigation|sidebar)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '')
        // Remove footer patterns
        .replace(/(?:footer|copyright|©|all rights reserved)[\s\S]*?$/gi, '')
        // Remove advertisement markers
        .replace(/(?:advertisement|sponsored|ad\s*:|promoted)/gi, '')
        // Remove social media share buttons text
        .replace(/(?:share on|follow us|subscribe|newsletter)/gi, '')
        // Remove cookie consent text
        .replace(/(?:cookie|privacy policy|terms of service|accept all)/gi, '')
        // Remove excessive whitespace
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
    
    return cleaned;
}

/**
 * Unified extraction interface that routes to appropriate extractor based on file type
 * @param {Object} options - Extraction options
 * @param {string} options.filePath - Path to file (for file uploads)
 * @param {string} options.fileType - Type of file ('pdf', 'docx', 'txt', 'url')
 * @param {string} options.url - URL to extract from (for URL extractions)
 * @param {string} options.userId - User ID for associating the extraction
 * @param {string} options.filename - Original filename
 * @param {number} options.fileSize - File size in bytes
 * @returns {Promise<{processingId: string, status: string, preview: string}>}
 */
export async function extractDocument(options) {
    const { filePath, fileType, url, userId, filename, fileSize } = options;
    
    // Create initial processing record
    const processingRecord = new DocumentProcessing({
        userId,
        filename: filename || (url ? new URL(url).hostname : 'unknown'),
        fileType,
        fileSize,
        url: url || null,
        extractionStatus: 'processing'
    });
    
    try {
        await processingRecord.save();
        logger.info(`Created processing record ${processingRecord._id} for user ${userId}`);
        
        let extractionResult;
        
        // Route to appropriate extractor based on file type
        switch (fileType) {
            case 'pdf':
                if (!filePath) {
                    throw new Error('File path is required for PDF extraction');
                }
                extractionResult = await extractPDF(filePath);
                break;
                
            case 'docx':
                if (!filePath) {
                    throw new Error('File path is required for DOCX extraction');
                }
                extractionResult = await extractDOCX(filePath);
                break;
                
            case 'txt':
                if (!filePath) {
                    throw new Error('File path is required for text extraction');
                }
                extractionResult = await extractText(filePath);
                break;
                
            case 'url':
                if (!url) {
                    throw new Error('URL is required for URL extraction');
                }
                extractionResult = await extractFromURL(url);
                break;
                
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
        
        // Store extraction results
        const extractedText = extractionResult.text;
        const preview = extractedText.substring(0, 500);
        
        processingRecord.extractionStatus = 'completed';
        processingRecord.extractedText = extractedText;
        processingRecord.extractedTextPreview = preview;
        processingRecord.extractedTextLength = extractedText.length;
        
        await processingRecord.save();
        
        logger.info(`Extraction completed for processing record ${processingRecord._id}. Extracted ${extractedText.length} characters`);
        
        // Schedule cleanup of temporary file after successful extraction (5 minutes delay)
        if (filePath) {
            scheduleCleanup(filePath, 300000); // 5 minutes = 300000ms
            logger.info(`Scheduled cleanup for file: ${filePath}`);
        }
        
        return {
            processingId: processingRecord._id.toString(),
            status: 'completed',
            preview: preview,
            textLength: extractedText.length
        };
        
    } catch (error) {
        logger.error(`Extraction failed for processing record ${processingRecord._id}: ${error.message}`);
        
        // Update processing record with error
        processingRecord.extractionStatus = 'failed';
        processingRecord.errorMessage = error.message;
        await processingRecord.save();
        
        throw error;
    }
}

export default {
    extractPDF,
    extractDOCX,
    extractText,
    extractFromURL,
    extractDocument
};
