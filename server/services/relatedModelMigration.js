import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { Course, Section, Language } from '../models/index.js';

/**
 * Related Model Migration Service
 * Handles migration of Language models to work with sections
 */
class RelatedModelMigrationService {
    
    /**
     * Migrate all related models to the new schema
     */
    async migrateAllModels(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        logger.info('🔄 Starting related model migration...');
        
        const results = {
            languages: { migrated: 0, errors: 0 }
        };
        
        try {
            // Migrate Languages
            logger.info('🌐 Migrating Languages...');
            results.languages = await this.migrateLanguages({ dryRun, batchSize });
            
            logger.info('✅ Related model migration completed', results);
            return results;
            
        } catch (error) {
            logger.error('❌ Related model migration failed:', error);
            throw error;
        }
    }
    
    /**
     * Migrate Languages from legacy schema to new schema
     */
    async migrateLanguages(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        try {
            const legacyLanguages = await mongoose.connection.db.collection('langs').find({
                courseId: { $exists: false }
            }).toArray();
            
            logger.info(`Found ${legacyLanguages.length} legacy language preferences to migrate`);
            
            if (dryRun) {
                return { migrated: legacyLanguages.length, errors: 0, dryRun: true };
            }
            
            let migrated = 0;
            let errors = 0;
            
            for (let i = 0; i < legacyLanguages.length; i += batchSize) {
                const batch = legacyLanguages.slice(i, i + batchSize);
                
                for (const legacyLang of batch) {
                    try {
                        const course = await Course.findOne({ slug: legacyLang.course });
                        if (!course) {
                            logger.warn(`Course not found for legacy language: ${legacyLang.course}`);
                            errors++;
                            continue;
                        }
                        
                        const existingLang = await Language.findOne({
                            courseId: course._id,
                            lang: legacyLang.lang,
                            course: legacyLang.course
                        });
                        
                        if (existingLang) {
                            continue;
                        }
                        
                        const newLang = new Language({
                            userId: 'migrated',
                            courseId: course._id,
                            sectionId: null,
                            lang: legacyLang.lang || 'English',
                            course: legacyLang.course,
                            autoTranslate: false,
                            originalLanguage: 'English',
                            originalLangCode: 'en',
                            translationQuality: 'manual'
                        });
                        
                        await newLang.save();
                        migrated++;
                        
                    } catch (error) {
                        logger.error(`Failed to migrate language for course ${legacyLang.course}:`, error);
                        errors++;
                    }
                }
                
                logger.info(`Migrated languages batch ${Math.floor(i / batchSize) + 1}: ${migrated} migrated, ${errors} errors`);
            }
            
            return { migrated, errors };
            
        } catch (error) {
            logger.error('Failed to migrate languages:', error);
            throw error;
        }
    }
    
    /**
     * Create data consistency checks
     */
    async performConsistencyChecks() {
        logger.info('🔍 Performing data consistency checks...');
        
        const results = {
            orphanedLanguages: 0
        };
        
        try {
            const languagesWithInvalidCourses = await Language.aggregate([
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                {
                    $match: { course: { $size: 0 } }
                }
            ]);
            results.orphanedLanguages = languagesWithInvalidCourses.length;
            
            logger.info('✅ Data consistency check completed', results);
            return results;
            
        } catch (error) {
            logger.error('❌ Data consistency check failed:', error);
            throw error;
        }
    }
    
    /**
     * Clean up orphaned data
     */
    async cleanupOrphanedData(options = {}) {
        const { dryRun = false } = options;
        
        logger.info('🧹 Cleaning up orphaned data...');
        
        const results = {
            deletedLanguages: 0
        };
        
        if (dryRun) {
            const consistencyResults = await this.performConsistencyChecks();
            return {
                ...results,
                wouldDelete: consistencyResults,
                dryRun: true
            };
        }
        
        try {
            const orphanedLanguages = await Language.aggregate([
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                {
                    $match: { course: { $size: 0 } }
                }
            ]);
            
            for (const lang of orphanedLanguages) {
                await Language.findByIdAndDelete(lang._id);
                results.deletedLanguages++;
            }
            
            logger.info('✅ Orphaned data cleanup completed', results);
            return results;
            
        } catch (error) {
            logger.error('❌ Orphaned data cleanup failed:', error);
            throw error;
        }
    }
}

export default new RelatedModelMigrationService();
