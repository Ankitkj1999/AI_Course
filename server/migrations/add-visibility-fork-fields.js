import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

// MongoDB connection with improved timeout settings
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            retryReads: true
        });
        console.log('MongoDB connected for migration');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define schemas (simplified versions for migration)
const userSchema = new mongoose.Schema({
    email: String,
    mName: String
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', mongoose.Schema({}, { strict: false }));
const Quiz = mongoose.model('Quiz', mongoose.Schema({}, { strict: false }));
const Flashcard = mongoose.model('Flashcard', mongoose.Schema({}, { strict: false }));
const Guide = mongoose.model('Guide', mongoose.Schema({}, { strict: false }));

/**
 * Migration script to add visibility and fork fields to existing content
 * This script:
 * 1. Adds isPublic, forkCount, forkedFrom, and ownerName fields to all content types
 * 2. Sets default values (isPublic: false, forkCount: 0)
 * 3. Populates ownerName from User collection
 * 4. Creates database indexes for efficient queries
 */
async function migrateContent() {
    console.log('Starting migration: Adding visibility and fork fields...\n');

    try {
        // Get all users for name lookup
        const users = await User.find({}).select('_id email mName');
        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), user.mName || user.email || 'Unknown User');
        });
        console.log(`Loaded ${users.length} users for name mapping\n`);

        // Migrate Courses
        console.log('Migrating Courses...');
        const courses = await Course.find({}).lean();
        let courseCount = 0;
        
        // Use bulkWrite for better performance
        const courseBulkOps = courses.map(course => {
            const ownerName = userMap.get(course.user) || 'Unknown User';
            return {
                updateOne: {
                    filter: { _id: course._id },
                    update: {
                        $set: {
                            isPublic: false,
                            forkCount: 0,
                            forkedFrom: {
                                contentId: null,
                                originalOwnerId: null,
                                originalOwnerName: null,
                                forkedAt: null
                            },
                            ownerName: ownerName
                        }
                    }
                }
            };
        });
        
        if (courseBulkOps.length > 0) {
            const result = await Course.bulkWrite(courseBulkOps);
            courseCount = result.modifiedCount;
        }
        console.log(`✓ Migrated ${courseCount} courses\n`);

        // Migrate Quizzes
        console.log('Migrating Quizzes...');
        const quizzes = await Quiz.find({}).lean();
        let quizCount = 0;
        
        const quizBulkOps = quizzes.map(quiz => {
            const ownerName = userMap.get(quiz.userId) || 'Unknown User';
            return {
                updateOne: {
                    filter: { _id: quiz._id },
                    update: {
                        $set: {
                            isPublic: false,
                            forkCount: 0,
                            forkedFrom: {
                                contentId: null,
                                originalOwnerId: null,
                                originalOwnerName: null,
                                forkedAt: null
                            },
                            ownerName: ownerName
                        }
                    }
                }
            };
        });
        
        if (quizBulkOps.length > 0) {
            const result = await Quiz.bulkWrite(quizBulkOps);
            quizCount = result.modifiedCount;
        }
        console.log(`✓ Migrated ${quizCount} quizzes\n`);

        // Migrate Flashcards
        console.log('Migrating Flashcards...');
        const flashcards = await Flashcard.find({}).lean();
        let flashcardCount = 0;
        
        const flashcardBulkOps = flashcards.map(flashcard => {
            const ownerName = userMap.get(flashcard.userId) || 'Unknown User';
            return {
                updateOne: {
                    filter: { _id: flashcard._id },
                    update: {
                        $set: {
                            isPublic: false,
                            forkCount: 0,
                            forkedFrom: {
                                contentId: null,
                                originalOwnerId: null,
                                originalOwnerName: null,
                                forkedAt: null
                            },
                            ownerName: ownerName
                        }
                    }
                }
            };
        });
        
        if (flashcardBulkOps.length > 0) {
            const result = await Flashcard.bulkWrite(flashcardBulkOps);
            flashcardCount = result.modifiedCount;
        }
        console.log(`✓ Migrated ${flashcardCount} flashcards\n`);

        // Migrate Guides
        console.log('Migrating Guides...');
        const guides = await Guide.find({}).lean();
        let guideCount = 0;
        
        const guideBulkOps = guides.map(guide => {
            const ownerName = userMap.get(guide.userId) || 'Unknown User';
            return {
                updateOne: {
                    filter: { _id: guide._id },
                    update: {
                        $set: {
                            isPublic: false,
                            forkCount: 0,
                            forkedFrom: {
                                contentId: null,
                                originalOwnerId: null,
                                originalOwnerName: null,
                                forkedAt: null
                            },
                            ownerName: ownerName
                        }
                    }
                }
            };
        });
        
        if (guideBulkOps.length > 0) {
            const result = await Guide.bulkWrite(guideBulkOps);
            guideCount = result.modifiedCount;
        }
        console.log(`✓ Migrated ${guideCount} guides\n`);

        // Create indexes
        console.log('Creating database indexes...');
        await Course.collection.createIndex({ isPublic: 1, date: -1 });
        await Quiz.collection.createIndex({ isPublic: 1, createdAt: -1 });
        await Flashcard.collection.createIndex({ isPublic: 1, createdAt: -1 });
        await Guide.collection.createIndex({ isPublic: 1, createdAt: -1 });
        console.log('✓ Created compound indexes for efficient public content queries\n');

        console.log('Migration completed successfully!');
        console.log(`Total migrated: ${courseCount + quizCount + flashcardCount + guideCount} items`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Run migration
(async () => {
    try {
        await connectDB();
        await migrateContent();
        console.log('\nClosing database connection...');
        await mongoose.connection.close();
        console.log('Migration complete. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
})();
