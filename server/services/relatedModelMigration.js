import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { Course, Section, Notes, Exam, Language } from '../models/index.js';

/**
 * Related Model Migration Service
 * Handles migration of Notes, Exams, and Language models to work with sections
 */
class RelatedModelMigrationService {
    
    /**
     * Migrate all related models to the new schema
     */
    async migrateAllModels(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        logger.info('🔄 Starting related model migration...');
        
        const results = {
            notes: { migrated: 0, errors: 0 },
            exams: { migrated: 0, errors: 0 },
            languages: { migrated: 0, errors: 0 }
        };
        
        try {
            // Migrate Notes
            logger.info('📝 Migrating Notes...');
            results.notes = await this.migrateNotes({ dryRun, batchSize });
            
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
     * Migrate Notes from legacy schema to new schema
     */
    async migrateNotes(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        try {
            // Get legacy notes (assuming they're in the old format)
            const legacyNotes = await mongoose.connection.db.collection('notes').find({
                courseId: { $exists: false } // Legacy notes don't have courseId
            }).toArray();
            
            logger.info(`Found ${legacyNotes.length} legacy notes to migrate`);
            
            if (dryRun) {
                return { migrated: legacyNotes.length, errors: 0, dryRun: true };
            }
            
            let migrated = 0;
            let errors = 0;
            
            // Process in batches
            for (let i = 0; i < legacyNotes.length; i += batchSize) {
                const batch = legacyNotes.slice(i, i + batchSize);
                
                for (const legacyNote of batch) {
                    try {
                        // Find course by slug (legacy course field)
                        const course = await Course.findOne({ slug: legacyNote.course });
                        if (!course) {
                            logger.warn(`Course not found for legacy note: ${legacyNote.course}`);
                            errors++;
                            continue;
                        }
                        
                        // Check if already migrated
                        const existingNote = await Notes.findOne({
                            courseId: course._id,
                            notes: legacyNote.notes,
                            course: legacyNote.course
                        });
                        
                        if (existingNote) {
                            logger.debug(`Note already migrated for course: ${legacyNote.course}`);
                            continue;
                        }
                        
                        // Create new note with enhanced schema
                        const newNote = new Notes({
                            userId: 'migrated', // Default user ID for migrated notes
                            courseId: course._id,
                            sectionId: null, // Course-level notes
                            notes: legacyNote.notes,
                            course: legacyNote.course, // Maintain legacy field
                            format: 'plain',
                            isPrivate: true,
                            title: `Notes for ${course.title}`,
                            tags: ['migrated']
                        });
                        
                        await newNote.save();
                        migrated++;
                        
                    } catch (error) {
                        logger.error(`Failed to migrate note for course ${legacyNote.course}:`, error);
                        errors++;
                    }
                }
                
                logger.info(`Migrated notes batch ${Math.floor(i / batchSize) + 1}: ${migrated} migrated, ${errors} errors`);
            }
            
            return { migrated, errors };
            
        } catch (error) {
            logger.error('Failed to migrate notes:', error);
            throw error;
        }
    }
    
    /**
     * Migrate Exams from legacy schema to new schema
     */
    async migrateExams(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;
        
        try {
            // Get legacy exams
            const legacyExams = await mongoose.connection.db.collection('exams').find({
                courseId: { $exists: false } // Legacy exams don't have courseId
            }).toArray();
            
            logger.info(`Found ${legacyExams.length} legacy exams to migrate`);
            
            if (dryRun) {
                return { migrated: legacyExams.length, errors: 0, dryRun: true };
            }
            
            let migrated = 0;
            let errors = 0;
            
            // Process in batches
            for (let i = 0; i < legacyExams.length; i += batchSize) {
                const batch = legacyExams.slice(i, i + batchSize);
                
                for (const legacyExam of batch) {
                    try {
                        // Find course by slug
                        const course = await Course.findOne({ slug: legacyExam.course });
                        if (!course) {
                            logger.warn(`Course not found for legacy exam: ${legacyExam.course}`);
                            errors++;
                            continue;
                        }
                        
                        // Check if already migrated
                        const existingExam = await Exam.findOne({
                            courseId: course._id,
                            exam: legacyExam.exam,
                            course: legacyExam.course
                        });
                        
                        if (existingExam) {
                            logger.debug(`Exam already migrated for course: ${legacyExam.course}`);
                            continue;
                        }
                        
                        // Parse marks to get score
                        const scorePercentage = this.parseMarksToPercentage(legacyExam.marks);
                        
                        // Create new exam with enhanced schema
                        const newExam = new Exam({
                            userId: 'migrated', // Default user ID for migrated exams
                            courseId: course._id,
                            sectionId: null, // Course-level exam
                            exam: legacyExam.exam,
                            marks: legacyExam.marks,
                            passed: legacyExam.passed || false,
                            course: legacyExam.course, // Maintain legacy field
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
            // Get legacy languages
            const legacyLanguages = await mongoose.connection.db.collection('langs').find({
                courseId: { $exists: false } // Legacy languages don't have courseId
            }).toArray();
            
            logger.info(`Found ${legacyLanguages.length} legacy language preferences to migrate`);
            
            if (dryRun) {
                return { migrated: legacyLanguages.length, errors: 0, dryRun: true };
            }
            
            let migrated = 0;
            let errors = 0;
            
            // Process in batches
            for (let i = 0; i < legacyLanguages.length; i += batchSize) {
                const batch = legacyLanguages.slice(i, i + batchSize);
                
                for (const legacyLang of batch) {
                    try {
                        // Find course by slug
                        const course = await Course.findOne({ slug: legacyLang.course });
                        if (!course) {
                            logger.warn(`Course not found for legacy language: ${legacyLang.course}`);
                            errors++;
                            continue;
                        }
                        
                        // Check if already migrated
                        const existingLang = await Language.findOne({
                            courseId: course._id,
                            lang: legacyLang.lang,
                            course: legacyLang.course
                        });
                        
                        if (existingLang) {
                            logger.debug(`Language already migrated for course: ${legacyLang.course}`);
                            continue;
                        }
                        
                        // Create new language preference with enhanced schema
                        const newLang = new Language({
                            userId: 'migrated', // Default user ID for migrated languages
                            courseId: course._id,
                            sectionId: null, // Course-level language preference
                            lang: legacyLang.lang || 'English',
                            course: legacyLang.course, // Maintain legacy field
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
            orphanedNotes: 0,
            orphanedExams: 0,
            orphanedLanguages: 0,
            invalidReferences: 0
        };
        
        try {
            // Check for orphaned notes (references to non-existent courses)
            const notesWithInvalidCourses = await Notes.aggregate([
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
            results.orphanedNotes = notesWithInvalidCourses.length;
            
            // Check for orphaned exams
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
            
            // Check for orphaned languages
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
            
            // Check for invalid section references
            const invalidSectionRefs = await Notes.aggregate([
                {
                    $match: { sectionId: { $ne: null } }
                },
                {
                    $lookup: {
                        from: 'sections',
                        localField: 'sectionId',
                        foreignField: '_id',
                        as: 'section'
                    }
                },
                {
                    $match: { section: { $size: 0 } }
                }
            ]);
            results.invalidReferences += invalidSectionRefs.length;
            
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
            deletedNotes: 0,
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
            // Delete orphaned notes
            const orphanedNotes = await Notes.aggregate([
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
            
            for (const note of orphanedNotes) {
                await Notes.findByIdAndDelete(note._id);
                results.deletedNotes++;
            }
            
            // Delete orphaned exams
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
            
            // Delete orphaned languages
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
     * Helper method to parse marks to percentage
     */
    parseMarksToPercentage(marks) {
        if (!marks) return 0;
        
        // Try to parse marks like "8/10", "15/20", etc.
        const match = marks.match(/(\d+)\/(\d+)/);
        if (match) {
            const [, correct, total] = match;
            return Math.round((parseInt(correct) / parseInt(total)) * 100);
        }
        
        // Try to parse percentage like "85%"
        const percentMatch = marks.match(/(\d+)%/);
        if (percentMatch) {
            return parseInt(percentMatch[1]);
        }
        
        // Default to 0 if can't parse
        return 0;
    }
    
    /**
     * Get migration status
     */
    async getMigrationStatus() {
        try {
            const status = {
                legacy: {
                    notes: await mongoose.connection.db.collection('notes').countDocuments({ courseId: { $exists: false } }),
                    exams: await mongoose.connection.db.collection('exams').countDocuments({ courseId: { $exists: false } }),
                    languages: await mongoose.connection.db.collection('langs').countDocuments({ courseId: { $exists: false } })
                },
                migrated: {
                    notes: await Notes.countDocuments({ userId: 'migrated' }),
                    exams: await Exam.countDocuments({ userId: 'migrated' }),
                    languages: await Language.countDocuments({ userId: 'migrated' })
                },
                total: {
                    notes: await Notes.countDocuments(),
                    exams: await Exam.countDocuments(),
                    languages: await Language.countDocuments()
                }
            };
            
            return status;
        } catch (error) {
            logger.error('Failed to get migration status:', error);
            throw error;
        }
    }
}

// Create singleton instance
const relatedModelMigrationService = new RelatedModelMigrationService();

export default relatedModelMigrationService;