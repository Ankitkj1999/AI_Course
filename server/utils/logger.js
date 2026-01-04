import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info'; // Changed from 'warn' to 'info' for production
};

// Define different log formats
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define which transports the logger must use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: format,
    }),
    // File transport for errors
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),
    // File transport for all logs
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ],
});

// LLM-specific logging enhancements
const LLMLogger = {
    // Generate unique request ID for correlation
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Log LLM operation with context and tags
    logLLMOperation(level, message, context = {}) {
        const {
            requestId,
            endpoint,
            tags = [],
            userId,
            provider,
            duration,
            error,
            request,
            response,
            ...additionalData
        } = context;

        const logData = {
            requestId,
            endpoint,
            tags: ['LLM', ...tags],
            userId,
            provider,
            duration,
            ...additionalData
        };

        // Include error details if present
        if (error) {
            logData.error = {
                message: error.message,
                type: error.constructor.name,
                stack: error.stack
            };
        }

        // Include request/response data if present
        if (request) {
            logData.request = this.sanitizeData(request);
        }
        if (response) {
            logData.response = this.sanitizeData(response);
        }

        logger.log(level, message, logData);
    },

    // Sanitize sensitive data from logs
    sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sanitized = { ...data };
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
        
        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
        }
        
        return sanitized;
    },

    // Log LLM request start
    logRequestStart(requestId, endpoint, payload, userId, provider) {
        this.logLLMOperation('info', 'LLM request started', {
            requestId,
            endpoint,
            tags: [this.getEndpointTag(endpoint), 'REQUEST_START'],
            userId,
            provider,
            request: payload
        });
    },

    // Log LLM request success
    logRequestSuccess(requestId, endpoint, response, duration, userId, provider) {
        this.logLLMOperation('info', 'LLM request completed successfully', {
            requestId,
            endpoint,
            tags: [this.getEndpointTag(endpoint), 'REQUEST_SUCCESS'],
            userId,
            provider,
            duration,
            response
        });
    },

    // Log LLM request error
    logRequestError(requestId, endpoint, error, context = {}) {
        this.logLLMOperation('error', 'LLM request failed', {
            requestId,
            endpoint,
            tags: [this.getEndpointTag(endpoint), 'REQUEST_ERROR'],
            error,
            ...context
        });
    },

    // Log provider fallback
    logProviderFallback(requestId, endpoint, originalProvider, fallbackProvider, reason) {
        this.logLLMOperation('warn', 'LLM provider fallback triggered', {
            requestId,
            endpoint,
            tags: [this.getEndpointTag(endpoint), 'PROVIDER_FALLBACK'],
            originalProvider,
            fallbackProvider,
            reason
        });
    },

    // Log performance metrics
    logPerformance(requestId, endpoint, metrics) {
        this.logLLMOperation('info', 'LLM performance metrics', {
            requestId,
            endpoint,
            tags: [this.getEndpointTag(endpoint), 'PERFORMANCE'],
            ...metrics
        });
    },

    // Get endpoint-specific tag
    getEndpointTag(endpoint) {
        if (endpoint.includes('/course')) return 'COURSE';
        if (endpoint.includes('/quiz')) return 'QUIZ';
        if (endpoint.includes('/flashcard')) return 'FLASHCARD';
        if (endpoint.includes('/guide')) return 'GUIDE';
        if (endpoint.includes('/generate')) return 'GENERATE';
        return 'UNKNOWN';
    },

    // Log validation failure
    logValidationFailure(requestId, endpoint, validation, actualData) {
        this.logLLMOperation('warn', 'Response validation failed', {
            requestId,
            endpoint,
            tags: [this.getEndpointTag(endpoint), 'VALIDATION_FAILURE'],
            validation,
            actualData: this.sanitizeData(actualData)
        });
    }
};

// Extend the base logger with LLM functionality
logger.llm = LLMLogger;

export default logger;