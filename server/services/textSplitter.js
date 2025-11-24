import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import logger from '../utils/logger.js';

/**
 * Text Splitter Service
 * 
 * Handles splitting large documents into manageable chunks while maintaining context.
 * Uses LangChain's RecursiveCharacterTextSplitter with intelligent separators.
 */

/**
 * Split text into chunks with overlap for context preservation
 * 
 * @param {string} text - The text to split
 * @param {Object} options - Optional configuration
 * @param {number} options.chunkSize - Size of each chunk (default: 4000)
 * @param {number} options.chunkOverlap - Overlap between chunks (default: 200)
 * @returns {Promise<Array<{pageContent: string, metadata: object}>>} Array of text chunks
 */
export async function splitText(text, options = {}) {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    const chunkSize = options.chunkSize || 4000;
    const chunkOverlap = options.chunkOverlap || 200;

    // Handle edge case: small documents that don't need splitting
    if (text.length < chunkSize) {
      logger.info(`Text length (${text.length}) is less than chunk size (${chunkSize}), returning as single chunk`);
      return [{
        pageContent: text,
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          originalLength: text.length
        }
      }];
    }

    // Create text splitter with configuration
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', '']
    });

    logger.info(`Splitting text of length ${text.length} with chunk size ${chunkSize} and overlap ${chunkOverlap}`);

    // Split the text
    const chunks = await splitter.createDocuments([text]);

    // Add metadata to chunks
    const enrichedChunks = chunks.map((chunk, index) => ({
      pageContent: chunk.pageContent,
      metadata: {
        ...chunk.metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
        originalLength: text.length
      }
    }));

    logger.info(`Successfully split text into ${enrichedChunks.length} chunks`);

    return enrichedChunks;
  } catch (error) {
    logger.error('Error splitting text:', error);
    throw new Error(`Text splitting failed: ${error.message}`);
  }
}

/**
 * Get the combined text from chunks
 * 
 * @param {Array<{pageContent: string}>} chunks - Array of text chunks
 * @returns {string} Combined text
 */
export function combineChunks(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return '';
  }

  return chunks.map(chunk => chunk.pageContent).join('\n\n');
}

/**
 * Calculate the number of chunks that will be created for a given text
 * 
 * @param {number} textLength - Length of the text
 * @param {number} chunkSize - Size of each chunk (default: 4000)
 * @param {number} chunkOverlap - Overlap between chunks (default: 200)
 * @returns {number} Estimated number of chunks
 */
export function estimateChunkCount(textLength, chunkSize = 4000, chunkOverlap = 200) {
  if (textLength < chunkSize) {
    return 1;
  }

  // Approximate calculation: each chunk after the first adds (chunkSize - chunkOverlap) characters
  const effectiveChunkSize = chunkSize - chunkOverlap;
  return Math.ceil((textLength - chunkSize) / effectiveChunkSize) + 1;
}

export default {
  splitText,
  combineChunks,
  estimateChunkCount
};
