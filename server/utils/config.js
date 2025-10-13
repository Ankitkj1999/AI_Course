import portfinder from 'portfinder';
import logger from './logger.js';

/**
 * Server configuration utility
 */

// Get server port with dynamic fallback
export const getServerPort = async (preferredPort = 5010) => {
    try {
        // In production, use the specified port strictly
        if (process.env.NODE_ENV === 'production') {
            return preferredPort;
        }
        
        // In development, find available port
        portfinder.setBasePort(preferredPort);
        const availablePort = await portfinder.getPortPromise();
        
        if (availablePort !== preferredPort) {
            logger.info(`Port ${preferredPort} is busy, found available port: ${availablePort}`);
        }
        
        return availablePort;
    } catch (error) {
        logger.error(`Error finding available port: ${error.message}`);
        return preferredPort;
    }
};

// Get server URL based on current port
export const getServerURL = (port) => {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.NODE_ENV === 'production' 
        ? process.env.DOMAIN || 'localhost' 
        : 'localhost';
    
    return `${protocol}://${host}:${port}`;
};

// Configuration object
export const serverConfig = {
    port: {
        preferred: parseInt(process.env.PORT) || 5010,
        range: {
            min: 5010,
            max: 5020
        }
    },
    cors: {
        development: {
            allowAnyLocalhost: true,
            logRequests: true
        },
        production: {
            strictOrigins: true,
            allowedDomains: [
                process.env.WEBSITE_URL,
                process.env.DOMAIN
            ].filter(Boolean)
        }
    },
    database: {
        uri: process.env.MONGODB_URI,
        options: {
            maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
    }
};

// Validate configuration
export const validateConfig = () => {
    const errors = [];
    
    if (!process.env.MONGODB_URI) {
        errors.push('MONGODB_URI is required');
    }
    
    if (!process.env.API_KEY) {
        errors.push('API_KEY (Google AI) is required');
    }
    
    if (!process.env.EMAIL || !process.env.PASSWORD) {
        errors.push('EMAIL and PASSWORD are required for email functionality');
    }
    
    if (errors.length > 0) {
        logger.error('Configuration validation failed:');
        errors.forEach(error => logger.error(`  - ${error}`));
        
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
    
    return errors.length === 0;
};