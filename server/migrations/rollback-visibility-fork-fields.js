import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

// MongoDB connection with improved timeout settings
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            retryReads: true
        });
        console.log('MongoDB connected for rollback');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define models with flexible schema
const Course = mongoose.model('Course', mongoose.Schema({}, { strict: false }));
const Quiz = mongoose.model('Quiz', mongoose.Schema({}, { strict: false }));
const Flashcard = mongoose.model('Flashcard', mongoose.Schema({}, { strict: false }));
const Guide = mongoose.model('Guide', mongoose.Schema({}, { strict: false }));

/**
 * Rollback script to remove visibility and fork fields from content
 * This script:
 * 1. Removes isPublic, forkCount, forkedFrom, and ownerName fields from all content types
 * 2. Drops the compound indexes created for public content queries
 */
async function rollbackContent() {
    console.log('Starting rollback: Removing visibility and fork fields...\n');

    try {
        // Rollback Courses
        console.log('Rolling back Courses...');
        const courseResult = await Course.updateMany(
            {},
            {
                $unset: {
                    isPublic: '',
                    forkCount: '',
                    forkedFrom: '',
                    ownerName: ''
                }
            }
        );
        console.log(`✓ Rolled back ${courseResult.modifiedCount} courses\n`);

        // Rollback Quizzes
        console.log('Rolling back Quizzes...');
        const quizResult = await Quiz.updateMany(
            {},
            {
                $unset: {
                    isPublic: '',
                    forkCount: '',
                    forkedFrom: '',
                    ownerName: ''
                }
            }
        );
        console.log(`✓ Rolled back ${quizResult.modifiedCount} quizzes\n`);

        // Rollback Flashcards
        console.log('Rolling back Flashcards...');
        const flashcardResult = await Flashcard.updateMany(
            {},
            {
                $unset: {
                    isPublic: '',
                    forkCount: '',
                    forkedFrom: '',
                    ownerName: ''
                }
            }
        );
        console.log(`✓ Rolled back ${flashcardResult.modifiedCount} flashcards\n`);

        // Rollback Guides
        console.log('Rolling back Guides...');
        const guideResult = await Guide.updateMany(
            {},
            {
                $unset: {
                    isPublic: '',
                    forkCount: '',
                    forkedFrom: '',
                    ownerName: ''
                }
            }
        );
        console.log(`✓ Rolled back ${guideResult.modifiedCount} guides\n`);

        // Drop indexes
        console.log('Dropping database indexes...');
        try {
            await Course.collection.dropIndex('isPublic_1_date_-1');
            console.log('✓ Dropped Course index');
        } catch (e) {
            console.log('  Course index not found or already dropped');
        }

        try {
            await Quiz.collection.dropIndex('isPublic_1_createdAt_-1');
            console.log('✓ Dropped Quiz index');
        } catch (e) {
            console.log('  Quiz index not found or already dropped');
        }

        try {
            await Flashcard.collection.dropIndex('isPublic_1_createdAt_-1');
            console.log('✓ Dropped Flashcard index');
        } catch (e) {
            console.log('  Flashcard index not found or already dropped');
        }

        try {
            await Guide.collection.dropIndex('isPublic_1_createdAt_-1');
            console.log('✓ Dropped Guide index');
        } catch (e) {
            console.log('  Guide index not found or already dropped');
        }

        console.log('\nRollback completed successfully!');
        const totalRolledBack = 
            courseResult.modifiedCount + 
            quizResult.modifiedCount + 
            flashcardResult.modifiedCount + 
            guideResult.modifiedCount;
        console.log(`Total rolled back: ${totalRolledBack} items`);

    } catch (error) {
        console.error('Rollback failed:', error);
        throw error;
    }
}

// Run rollback
(async () => {
    try {
        await connectDB();
        await rollbackContent();
        console.log('\nClosing database connection...');
        await mongoose.connection.close();
        console.log('Rollback complete. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('Rollback error:', error);
        process.exit(1);
    }
})();
