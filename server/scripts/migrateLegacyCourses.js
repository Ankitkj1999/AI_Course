import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CourseGenerationService from '../services/courseGenerationService.js';
import { Course } from '../models/index.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

/**
 * Migration script to convert legacy courses to the new section-based architecture
 */
class LegacyCourseMigration {
    
    static async connectDatabase() {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 2,
                retryWrites: true,
                retryReads: true,
            });
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    }
    
    static async findLegacyCourses() {
        try {
            // Find courses that have content but no sections (legacy format)
            const legacyCourses = await Course.find({
                content: { $exists: true, $ne: null, $ne: '' },
                $or: [
                    { sections: { $exists: false } },
                    { sections: { $size: 0 } }
                ]
            }).select('_id user title mainTopic content createdAt');
            
            console.log(`📊 Found ${legacyCourses.length} legacy courses to migrate`);
            return legacyCourses;
        } catch (error) {
            console.error('❌ Failed to find legacy courses:', error);
            return [];
        }
    }
    
    static async migrateCourse(course, dryRun = true) {
        try {
            console.log(`\n🔄 ${dryRun ? '[DRY RUN]' : '[MIGRATING]'} Course: ${course.title} (${course._id})`);
            console.log(`   User: ${course.user}`);
            console.log(`   Created: ${course.createdAt}`);
            
            if (dryRun) {
                // Just parse and analyze the content
                const parsedContent = CourseGenerationService.parseLegacyContent(course.content);
                console.log(`   📋 Sections to create: ${parsedContent.sections.length}`);
                
                let totalSubsections = 0;
                parsedContent.sections.forEach(section => {
                    if (section.subtopics && Array.isArray(section.subtopics)) {
                        totalSubsections += section.subtopics.length;
                    }
                });
                
                console.log(`   📄 Total subsections: ${totalSubsections}`);
                return { success: true, dryRun: true };
            } else {
                // Actually perform the migration
                const convertedCourse = await CourseGenerationService.convertLegacyCourse(
                    course._id.toString(),
                    course.user
                );
                
                console.log(`   ✅ Successfully migrated!`);
                console.log(`   📋 Sections created: ${convertedCourse.sections.length}`);
                
                return { success: true, courseId: convertedCourse._id, sectionsCreated: convertedCourse.sections.length };
            }
            
        } catch (error) {
            console.error(`   ❌ Migration failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    static async migrateAllCourses(options = {}) {
        const { dryRun = true, limit = null, userId = null } = options;
        
        console.log(`\n🚀 Starting legacy course migration ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
        
        let legacyCourses = await this.findLegacyCourses();
        
        // Filter by user if specified
        if (userId) {
            legacyCourses = legacyCourses.filter(course => course.user === userId);
            console.log(`📊 Filtered to ${legacyCourses.length} courses for user: ${userId}`);
        }
        
        // Limit if specified
        if (limit && limit > 0) {
            legacyCourses = legacyCourses.slice(0, limit);
            console.log(`📊 Limited to first ${legacyCourses.length} courses`);
        }
        
        if (legacyCourses.length === 0) {
            console.log('✅ No legacy courses found to migrate');
            return { total: 0, successful: 0, failed: 0 };
        }
        
        const results = {
            total: legacyCourses.length,
            successful: 0,
            failed: 0,
            errors: []
        };
        
        for (let i = 0; i < legacyCourses.length; i++) {
            const course = legacyCourses[i];
            console.log(`\n📍 Progress: ${i + 1}/${legacyCourses.length}`);
            
            const result = await this.migrateCourse(course, dryRun);
            
            if (result.success) {
                results.successful++;
            } else {
                results.failed++;
                results.errors.push({
                    courseId: course._id,
                    title: course.title,
                    error: result.error
                });
            }
            
            // Add a small delay to avoid overwhelming the database
            if (!dryRun && i < legacyCourses.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`\n📊 Migration Summary:`);
        console.log(`   Total courses: ${results.total}`);
        console.log(`   Successful: ${results.successful}`);
        console.log(`   Failed: ${results.failed}`);
        
        if (results.errors.length > 0) {
            console.log(`\n❌ Failed courses:`);
            results.errors.forEach(error => {
                console.log(`   - ${error.title} (${error.courseId}): ${error.error}`);
            });
        }
        
        return results;
    }
    
    static async disconnectDatabase() {
        try {
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ Failed to disconnect from MongoDB:', error);
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--live');
    const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
    const userId = args.find(arg => arg.startsWith('--user='))?.split('=')[1];
    
    console.log('🔧 Legacy Course Migration Tool');
    console.log('================================');
    
    if (dryRun) {
        console.log('ℹ️  Running in DRY RUN mode. Use --live to perform actual migration.');
    } else {
        console.log('⚠️  Running in LIVE mode. This will modify the database!');
    }
    
    await LegacyCourseMigration.connectDatabase();
    
    try {
        const results = await LegacyCourseMigration.migrateAllCourses({
            dryRun,
            limit: limit ? parseInt(limit) : null,
            userId
        });
        
        console.log('\n✅ Migration completed successfully!');
        
        if (dryRun && results.total > 0) {
            console.log('\nℹ️  To perform the actual migration, run:');
            console.log('   node scripts/migrateLegacyCourses.js --live');
        }
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await LegacyCourseMigration.disconnectDatabase();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default LegacyCourseMigration;