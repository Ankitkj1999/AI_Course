/**
 * Safe Property Access Utility
 * Provides safe access to nested object properties with fallback values
 * for external API responses that may have unexpected structures.
 */

/**
 * Safely access nested object properties
 * @param {Object} obj - The object to access properties from
 * @param {string} path - Dot-separated path to the property (e.g., 'response.results')
 * @param {*} defaultValue - Default value to return if property doesn't exist
 * @returns {*} The property value or default value
 */
export const safeGet = (obj, path, defaultValue = null) => {
    if (!obj || typeof obj !== 'object') {
        return defaultValue;
    }

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }

    return current !== undefined ? current : defaultValue;
};

/**
 * Safely access array properties with length validation
 * @param {Object} obj - The object to access properties from
 * @param {string} path - Dot-separated path to the array property
 * @param {*} defaultValue - Default value to return if array is empty or doesn't exist
 * @returns {*} The array or default value
 */
export const safeGetArray = (obj, path, defaultValue = []) => {
    const result = safeGet(obj, path, defaultValue);
    return Array.isArray(result) ? result : defaultValue;
};

/**
 * Safely access the first item of an array property
 * @param {Object} obj - The object to access properties from
 * @param {string} path - Dot-separated path to the array property
 * @param {*} defaultValue - Default value to return if array is empty or doesn't exist
 * @returns {*} The first array item or default value
 */
export const safeGetFirst = (obj, path, defaultValue = null) => {
    const array = safeGetArray(obj, path, []);
    return array.length > 0 ? array[0] : defaultValue;
};

/**
 * Validate external API response structure
 * @param {Object} response - The API response to validate
 * @param {Object} expectedStructure - Expected structure definition
 * @returns {Object} Validation result with success flag and missing fields
 */
export const validateResponseStructure = (response, expectedStructure) => {
    const missing = [];
    
    const checkStructure = (obj, structure, currentPath = '') => {
        for (const [key, value] of Object.entries(structure)) {
            const fullPath = currentPath ? `${currentPath}.${key}` : key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Nested object
                const nestedObj = safeGet(obj, key);
                if (nestedObj === null || typeof nestedObj !== 'object') {
                    missing.push(fullPath);
                } else {
                    checkStructure(nestedObj, value, fullPath);
                }
            } else {
                // Simple property
                if (safeGet(obj, key) === null) {
                    missing.push(fullPath);
                }
            }
        }
    };
    
    checkStructure(response, expectedStructure);
    
    return {
        success: missing.length === 0,
        missing: missing
    };
};

/**
 * Create a safe wrapper for external API calls
 * @param {Function} apiCall - The API call function
 * @param {Object} fallbackResponse - Fallback response structure
 * @returns {Function} Wrapped API call with error handling
 */
export const createSafeApiWrapper = (apiCall, fallbackResponse = {}) => {
    return async (...args) => {
        try {
            const result = await apiCall(...args);
            return {
                success: true,
                data: result,
                fallback: false
            };
        } catch (error) {
            return {
                success: false,
                data: fallbackResponse,
                fallback: true,
                error: error.message
            };
        }
    };
};

export default {
    safeGet,
    safeGetArray,
    safeGetFirst,
    validateResponseStructure,
    createSafeApiWrapper
};