import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { Course, Section, Exam, Language } from '../models/index.js';

/**
 * Related Model Migration Service
 * Handles migration of Exams and Language models to work with sections
 */
class RelatedModelMigrationService {
    
    /**
     * Migrate all related models to the new schema
     */
    async migrateAllModels(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        logger.info('🔄 Starting related model migration...');
        
        const results = {
            exams: { migrated: 0, errors: 0 },
            languages: { migrated: 0, errors: 0 }
        };
        
        try {
            // Migrate Exams
            logger.info('📊 Migrating Exams...');
            results.exams = await this.migrateExams({ dryRun, batchSize });
            
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
     * Migrate Exams from legacy schema to new schema
     */
    async migrateExams(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        try {
            const legacyExams = await mongoose.connection.db.collection('exams').find({
                courseId: { $exists: false }
            }).toArray();
            
            logger.info(`Found ${legacyExams.length} legacy exams to migrate`);
            
            if (dryRun) {
                return { migrated: legacyExams.length, errors: 0, dryRun: true };
            }
            
            let migrated = 0;
            let errors = 0;
            
            for (let i = 0; i < legacyExams.length; i += batchSize) {
                const batch = legacyExams.slice(i, i + batchSize);
                
                for (const legacyExam of batch) {
                    try {
                        const course = await Course.findOne({ slug: legacyExam.course });
                        if (!course) {
                            logger.warn(`Course not found for legacy exam: ${legacyExam.course}`);
                            errors++;
                            continue;
                        }
                        
                        const existingExam = await Exam.findOne({
                            courseId: course._id,
                            exam: legacyExam.exam,
                            course: legacyExam.course
                        });
                        
                        if (existingExam) {
                            continue;
                        }
                        
                        const scorePercentage = this.parseMarksToPercentage(legacyExam.marks);
                        
                        const newExam = new Exam({
                            userId: 'migrated',
                            courseId: course._id,
                            sectionId: null,
                            exam: legacyExam.exam,
                            marks: legacyExam.marks,
                            passed: legacyExam.passed || false,
                            course: legacyExam.course,
                            examType: 'quiz',
                            scorePercentage,
                            title: `Exam for ${course.title}`,
                            passingScore: 70,
                            attemptNumber: 1
                        });
                        
                        await newExam.save();
                        migrated++;
                        
                    } catch (error) {
                        logger.error(`Failed to migrate exam for course ${legacyExam.course}:`, error);
                        errors++;
                    }
                }
                
                logger.info(`Migrated exams batch ${Math.floor(i / batchSize) + 1}: ${migrated} migrated, ${errors} errors`);
            }
            
            return { migrated, errors };
            
        } catch (error) {
            logger.error('Failed to migrate exams:', error);
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
            orphanedExams: 0,
            orphanedLanguages: 0
        };
        
        try {
            const examsWithInvalidCourses = await Exam.aggregate([
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
            results.orphanedExams = examsWithInvalidCourses.length;
            
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
            deletedExams: 0,
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
            const orphanedExams = await Exam.aggregate([
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
            
            for (const exam of orphanedExams) {
                await Exam.findByIdAndDelete(exam._id);
                results.deletedExams++;
            }
            
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
    
    /**
     * Parse marks string to percentage
     */
    parseMarksToPercentage(marks) {
        if (!marks) return 0;
        
        try {
            if (typeof marks === 'number') return marks;
            
            if (marks.includes('/')) {
                const [score, total] = marks.split('/').map(Number);
                return total > 0 ? (score / total) * 100 : 0;
            }
            
            if (marks.includes('%')) {
                return parseFloat(marks.replace('%', ''));
            }
            
            return parseFloat(marks) || 0;
        } catch {
            return 0;
        }
    }
}

export default new RelatedModelMigrationService();
