import fs from 'fs/promises';
import logger from '../utils/logger.js';

/**
 * Immediately delete a file from the filesystem
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise
 */
export async function cleanupFile(filePath) {
    try {
        if (!filePath) {
            logger.warn('cleanupFile called with empty filePath');
            return false;
        }

        logger.info(`Attempting to delete file: ${filePath}`);
        
        // Check if file exists before attempting deletion
        try {
            await fs.access(filePath);
        } catch (error) {
            logger.warn(`File does not exist, skipping deletion: ${filePath}`);
            return true; // Consider it successful if file doesn't exist
        }

        // Delete the file
        await fs.unlink(filePath);
        logger.info(`Successfully deleted file: ${filePath}`);
        return true;

    } catch (error) {
        logger.error(`Failed to delete file ${filePath}: ${error.message}`, {
            error: error.message,
            stack: error.stack
        });
        return false;
    }
}

/**
 * Schedule a file for deletion after a specified delay
 * @param {string} filePath - Path to the file to delete
 * @param {number} delay - Delay in milliseconds before deletion (default: 5 minutes)
 * @returns {NodeJS.Timeout} - Timeout object that can be cleared if needed
 */
export function scheduleCleanup(filePath, delay = 300000) {
    if (!filePath) {
        logger.warn('scheduleCleanup called with empty filePath');
        return null;
    }

    logger.info(`Scheduling cleanup for file ${filePath} in ${delay}ms (${delay / 1000} seconds)`);

    const timeoutId = setTimeout(async () => {
        logger.info(`Executing scheduled cleanup for file: ${filePath}`);
        const success = await cleanupFile(filePath);
        
        if (!success) {
            logger.error(`Scheduled cleanup failed for file: ${filePath}`);
        }
    }, delay);

    return timeoutId;
}

export default {
    cleanupFile,
    scheduleCleanup
};
