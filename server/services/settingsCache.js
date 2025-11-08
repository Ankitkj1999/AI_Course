import Settings from '../models/Settings.js';

class SettingsCache {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.lastUpdated = new Map();
    }

    async get(key) {
        // Check cache first
        if (this.isCacheValid(key)) {
            return this.cache.get(key);
        }

        // Fetch from database, fallback to env
        try {
            // Add timeout to prevent hanging
            const setting = await Promise.race([
                Settings.findOne({ key }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database query timeout')), 5000)
                )
            ]);

            const value = setting ? setting.value : process.env[key];

            // Cache the result
            this.cache.set(key, value);
            this.lastUpdated.set(key, Date.now());

            return value;
        } catch (error) {
            console.warn(`Settings cache error for ${key}:`, error.message);
            // Don't log full error object to avoid cluttering logs
            return process.env[key]; // Fallback to env
        }
    }

    isCacheValid(key) {
        if (!this.cache.has(key)) return false;
        const lastUpdate = this.lastUpdated.get(key) || 0;
        return (Date.now() - lastUpdate) < this.CACHE_TTL;
    }

    // Clear cache when admin updates
    invalidate(key) {
        this.cache.delete(key);
        this.lastUpdated.delete(key);
    }

    // Preload critical settings
    async preload() {
        const criticalKeys = ['API_KEY', 'EMAIL', 'PASSWORD', 'LOGO', 'COMPANY', 'GOOGLE_CLIENT_ID', 'FACEBOOK_CLIENT_ID', 'GOOGLE_LOGIN_ENABLED', 'FACEBOOK_LOGIN_ENABLED', 'OPENROUTER_API_KEY'];

        try {
            // Preload settings with individual error handling to avoid one failure blocking all
            const preloadPromises = criticalKeys.map(async (key) => {
                try {
                    await this.get(key);
                } catch (error) {
                    console.warn(`Failed to preload setting ${key}:`, error.message);
                    // Continue with other settings even if one fails
                }
            });

            await Promise.allSettled(preloadPromises);
            console.log('Settings cache preload completed');
        } catch (error) {
            console.error('Settings cache preload encountered errors:', error.message);
            // Don't throw error - allow server to start even if preload fails
        }
    }
}

const settingsCache = new SettingsCache();
export default settingsCache;