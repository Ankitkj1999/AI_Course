import LegacyCompatibility from '../services/legacyCompatibility.js';

/**
 * Legacy API Middleware
 * Handles backward compatibility for existing API endpoints
 */

/**
 * Transform legacy course creation requests
 */
export const transformLegacyCourseCreation = async (req, res, next) => {
    try {
        // Check if this is a legacy course creation request
        if (req.body.content && typeof req.body.content === 'string') {
            // This looks like a legacy request with single content field
            req.isLegacyRequest = true;
            req.legacyData = { ...req.body };
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Legacy transformation error: ' + error.message });
    }
};

/**
 * Transform legacy course update requests
 */
export const transformLegacyCourseUpdate = async (req, res, next) => {
    try {
        // Check for legacy update patterns
        if (req.body.content !== undefined || req.body.completed !== undefined) {
            req.isLegacyRequest = true;
            req.legacyData = { ...req.body };
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Legacy transformation error: ' + error.message });
    }
};

/**
 * Transform course responses to legacy format
 */
export const transformCourseResponse = (options = {}) => {
    return async (req, res, next) => {
        try {
            const { includeContent = true, format = 'html' } = options;
            
            // Store original json method
            const originalJson = res.json;
            
            // Override json method to transform response
            res.json = async function(data) {
                try {
                    // Transform single course
                    if (data && data._id && data.title) {
                        const legacyCourse = await LegacyCompatibility.courseToLegacyFormat(
                            data, 
                            { includeContent, format }
                        );
                        return originalJson.call(this, legacyCourse);
                    }
                    
                    // Transform course array
                    if (Array.isArray(data)) {
                        const legacyCourses = [];
                        for (const course of data) {
                            if (course._id && course.title) {
                                const legacyCourse = await LegacyCompatibility.courseToLegacyFormat(
                                    course, 
                                    { includeContent: false, format }
                                );
                                legacyCourses.push(legacyCourse);
                            } else {
                                legacyCourses.push(course);
                            }
                        }
                        return originalJson.call(this, legacyCourses);
                    }
                    
                    // Transform paginated response
                    if (data && data.courses && Array.isArray(data.courses)) {
                        const legacyCourses = [];
                        for (const course of data.courses) {
                            const legacyCourse = await LegacyCompatibility.courseToLegacyFormat(
                                course, 
                                { includeContent: false, format }
                            );
                            legacyCourses.push(legacyCourse);
                        }
                        
                        return originalJson.call(this, {
                            ...data,
                            courses: legacyCourses
                        });
                    }
                    
                    // Return data unchanged if no transformation needed
                    return originalJson.call(this, data);
                    
                } catch (error) {
                    console.error('Error transforming response:', error);
                    return originalJson.call(this, data); // Fallback to original data
                }
            };
            
            next();
        } catch (error) {
            res.status(500).json({ error: 'Response transformation error: ' + error.message });
        }
    };
};

/**
 * Handle legacy query parameters
 */
export const transformLegacyQuery = (req, res, next) => {
    try {
        // Map legacy query parameters to new structure
        const legacyMappings = {
            'completed': (value) => {
                req.query.status = value === 'true' ? 'completed' : { $ne: 'completed' };
                delete req.query.completed;
            },
            'sortBy': (value) => {
                if (value === 'date') {
                    req.query.sortBy = 'createdAt';
                }
            }
        };
        
        // Apply mappings
        Object.keys(req.query).forEach(key => {
            if (legacyMappings[key]) {
                legacyMappings[key](req.query[key]);
            }
        });
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Query transformation error: ' + error.message });
    }
};

/**
 * Legacy error handler that maintains old error format
 */
export const legacyErrorHandler = (err, req, res, next) => {
    // Legacy error format
    const legacyError = {
        error: err.message || 'An error occurred',
        success: false
    };
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        legacyError.stack = err.stack;
    }
    
    // Determine status code
    let statusCode = 500;
    if (err.name === 'ValidationError') statusCode = 400;
    if (err.name === 'CastError') statusCode = 400;
    if (err.message.includes('not found')) statusCode = 404;
    if (err.message.includes('unauthorized') || err.message.includes('permission')) statusCode = 403;
    
    res.status(statusCode).json(legacyError);
};

/**
 * Compatibility check middleware
 */
export const checkCompatibility = (req, res, next) => {
    // Add compatibility headers
    res.set({
        'X-API-Version': 'legacy-compatible',
        'X-Schema-Version': '2.0'
    });
    
    // Log legacy API usage for monitoring
    if (req.isLegacyRequest) {
        console.log(`Legacy API usage: ${req.method} ${req.path}`, {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

/**
 * Fallback middleware for unsupported legacy endpoints
 */
export const legacyFallback = (req, res, next) => {
    // List of deprecated endpoints that should return helpful messages
    const deprecatedEndpoints = [
        '/api/course/legacy-export',
        '/api/course/legacy-import',
        '/api/course/bulk-update'
    ];
    
    if (deprecatedEndpoints.some(endpoint => req.path.includes(endpoint))) {
        return res.status(410).json({
            error: 'This endpoint has been deprecated',
            message: 'Please use the new section-based API endpoints',
            documentation: '/api/docs',
            migration: {
                available: true,
                endpoint: '/api/migration/status'
            }
        });
    }
    
    next();
};

export default {
    transformLegacyCourseCreation,
    transformLegacyCourseUpdate,
    transformCourseResponse,
    transformLegacyQuery,
    legacyErrorHandler,
    checkCompatibility,
    legacyFallback
};