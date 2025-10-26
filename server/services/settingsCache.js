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
            const setting = await Settings.findOne({ key });
            const value = setting ? setting.value : process.env[key];
            
            // Cache the result
            this.cache.set(key, value);
            this.lastUpdated.set(key, Date.now());
            
            return value;
        } catch (error) {
            console.error(`Settings cache error for ${key}:`, error);
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
        const criticalKeys = ['API_KEY', 'EMAIL', 'PASSWORD', 'LOGO', 'COMPANY', 'GOOGLE_CLIENT_ID', 'FACEBOOK_CLIENT_ID', 'GOOGLE_LOGIN_ENABLED', 'FACEBOOK_LOGIN_ENABLED'];
        await Promise.all(criticalKeys.map(key => this.get(key)));
        console.log('Settings cache preloaded');
    }
}

const settingsCache = new SettingsCache();
export default settingsCache;