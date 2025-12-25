import logger from '../utils/logger.js';

/**
 * Advanced Caching Service
 * Provides intelligent caching for frequently accessed content
 */
class CachingService {
    constructor() {
        this.enabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE === 'true';
        this.cache = new Map();
        this.accessCounts = new Map();
        this.lastAccess = new Map();
        
        // Cache configuration
        this.config = {
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 1000, // Maximum number of cache entries
            cleanupInterval: 60 * 1000, // 1 minute
            accessThreshold: 3, // Minimum access count to keep in cache
            ttlByType: {
                'course': 10 * 60 * 1000, // 10 minutes
                'section': 5 * 60 * 1000, // 5 minutes
                'hierarchy': 15 * 60 * 1000, // 15 minutes
                'stats': 30 * 60 * 1000, // 30 minutes
                'toc': 20 * 60 * 1000, // 20 minutes
                'search': 2 * 60 * 1000 // 2 minutes
            }
        };

        this.initializeCleanup();
        logger.info(`📦 Caching service initialized (enabled: ${this.enabled})`);
    }

    /**
     * Initialize automatic cache cleanup
     */
    initializeCleanup() {
        if (!this.enabled) return;

        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);

        // Cleanup on process exit
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    /**
     * Set cache entry with intelligent TTL
     */
    set(key, value, options = {}) {
        if (!this.enabled) return false;

        const {
            ttl = this.getTTLForKey(key),
            tags = [],
            priority = 'normal'
        } = options;

        // Check cache size limit
        if (this.cache.size >= this.config.maxSize) {
            this.evictLeastUsed();
        }

        const entry = {
            value,
            timestamp: Date.now(),
            ttl,
            tags,
            priority,
            accessCount: 0
        };

        this.cache.set(key, entry);
        this.accessCounts.set(key, 0);
        this.lastAccess.set(key, Date.now());

        logger.debug(`📦 Cached: ${key} (TTL: ${ttl}ms)`);
        return true;
    }

    /**
     * Get cache entry with access tracking
     */
    get(key) {
        if (!this.enabled) return null;

        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (this.isExpired(entry)) {
            this.delete(key);
            return null;
        }

        // Update access tracking
        entry.accessCount++;
        this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
        this.lastAccess.set(key, Date.now());

        logger.debug(`📦 Cache hit: ${key} (access count: ${entry.accessCount})`);
        return entry.value;
    }

    /**
     * Delete cache entry
     */
    delete(key) {
        if (!this.enabled) return false;

        const deleted = this.cache.delete(key);
        this.accessCounts.delete(key);
        this.lastAccess.delete(key);

        if (deleted) {
            logger.debug(`📦 Cache deleted: ${key}`);
        }

        return deleted;
    }

    /**
     * Invalidate cache entries by tags
     */
    invalidateByTags(tags) {
        if (!this.enabled || !Array.isArray(tags)) return 0;

        let invalidatedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
                this.delete(key);
                invalidatedCount++;
            }
        }

        if (invalidatedCount > 0) {
            logger.info(`📦 Invalidated ${invalidatedCount} cache entries by tags: ${tags.join(', ')}`);
        }

        return invalidatedCount;
    }

    /**
     * Invalidate cache entries by pattern
     */
    invalidateByPattern(pattern) {
        if (!this.enabled) return 0;

        const regex = new RegExp(pattern);
        let invalidatedCount = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.delete(key);
                invalidatedCount++;
            }
        }

        if (invalidatedCount > 0) {
            logger.info(`📦 Invalidated ${invalidatedCount} cache entries by pattern: ${pattern}`);
        }

        return invalidatedCount;
    }

    /**
     * Get or set cache entry (cache-aside pattern)
     */
    async getOrSet(key, fetchFunction, options = {}) {
        if (!this.enabled) {
            return await fetchFunction();
        }

        // Try to get from cache first
        let value = this.get(key);
        if (value !== null) {
            return value;
        }

        // Fetch and cache the value
        try {
            value = await fetchFunction();
            if (value !== null && value !== undefined) {
                this.set(key, value, options);
            }
            return value;
        } catch (error) {
            logger.error(`❌ Failed to fetch and cache ${key}:`, error);
            throw error;
        }
    }

    /**
     * Warm up cache with frequently accessed data
     */
    async warmUp(warmUpFunctions) {
        if (!this.enabled) return;

        logger.info('🔥 Starting cache warm-up...');

        const promises = Object.entries(warmUpFunctions).map(async ([key, fetchFunction]) => {
            try {
                const value = await fetchFunction();
                this.set(key, value, { priority: 'high' });
                logger.debug(`🔥 Warmed up: ${key}`);
            } catch (error) {
                logger.warn(`⚠️ Failed to warm up ${key}:`, error.message);
            }
        });

        await Promise.allSettled(promises);
        logger.info('✅ Cache warm-up completed');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const stats = {
            enabled: this.enabled,
            size: this.cache.size,
            maxSize: this.config.maxSize,
            hitRate: 0,
            memoryUsage: 0
        };

        if (this.enabled) {
            // Calculate hit rate (simplified)
            const totalAccesses = Array.from(this.accessCounts.values()).reduce((sum, count) => sum + count, 0);
            const cacheHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
            stats.hitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0;

            // Estimate memory usage (rough calculation)
            stats.memoryUsage = this.cache.size * 1024; // Rough estimate in bytes
        }

        return stats;
    }

    /**
     * Get detailed cache information
     */
    getDetailedStats() {
        if (!this.enabled) {
            return { enabled: false };
        }

        const entries = [];
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            entries.push({
                key,
                size: JSON.stringify(entry.value).length,
                age: now - entry.timestamp,
                ttl: entry.ttl,
                accessCount: entry.accessCount,
                priority: entry.priority,
                tags: entry.tags,
                expired: this.isExpired(entry)
            });
        }

        return {
            enabled: true,
            totalEntries: this.cache.size,
            entries: entries.sort((a, b) => b.accessCount - a.accessCount)
        };
    }

    /**
     * Helper methods
     */
    getTTLForKey(key) {
        for (const [type, ttl] of Object.entries(this.config.ttlByType)) {
            if (key.includes(type)) {
                return ttl;
            }
        }
        return this.config.defaultTTL;
    }

    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    evictLeastUsed() {
        let leastUsedKey = null;
        let leastUsedCount = Infinity;
        let oldestAccess = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            const accessCount = this.accessCounts.get(key) || 0;
            const lastAccessTime = this.lastAccess.get(key) || 0;

            // Prioritize by access count, then by last access time
            if (accessCount < leastUsedCount || 
                (accessCount === leastUsedCount && lastAccessTime < oldestAccess)) {
                leastUsedKey = key;
                leastUsedCount = accessCount;
                oldestAccess = lastAccessTime;
            }
        }

        if (leastUsedKey) {
            this.delete(leastUsedKey);
            logger.debug(`📦 Evicted least used: ${leastUsedKey}`);
        }
    }

    performCleanup() {
        let cleanedCount = 0;
        const now = Date.now();

        // Remove expired entries
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.delete(key);
                cleanedCount++;
            }
        }

        // Remove rarely accessed entries if cache is getting full
        if (this.cache.size > this.config.maxSize * 0.8) {
            const entriesToRemove = [];
            
            for (const [key, entry] of this.cache.entries()) {
                const accessCount = this.accessCounts.get(key) || 0;
                const lastAccessTime = this.lastAccess.get(key) || 0;
                
                // Remove entries with low access count and old last access
                if (accessCount < this.config.accessThreshold && 
                    now - lastAccessTime > this.config.defaultTTL * 2) {
                    entriesToRemove.push(key);
                }
            }

            entriesToRemove.forEach(key => {
                this.delete(key);
                cleanedCount++;
            });
        }

        if (cleanedCount > 0) {
            logger.debug(`🧹 Cache cleanup: removed ${cleanedCount} entries`);
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        if (!this.enabled) return;

        const size = this.cache.size;
        this.cache.clear();
        this.accessCounts.clear();
        this.lastAccess.clear();

        logger.info(`📦 Cache cleared: ${size} entries removed`);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
        logger.info('🧹 Caching service cleaned up');
    }
}

// Create singleton instance
const cachingService = new CachingService();

export default cachingService;