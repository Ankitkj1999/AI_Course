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
        console.log('MongoDB connected for schema verification');
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
 * Verification script to check if migration was successful
 */
async function verifySchema() {
    console.log('Verifying schema migration...\n');

    try {
        const collections = [
            { name: 'Course', model: Course },
            { name: 'Quiz', model: Quiz },
            { name: 'Flashcard', model: Flashcard },
            { name: 'Guide', model: Guide }
        ];

        for (const { name, model } of collections) {
            console.log(`\n=== ${name} Collection ===`);
            
            // Check if documents exist
            const count = await model.countDocuments();
            console.log(`Total documents: ${count}`);

            if (count > 0) {
                // Get a sample document
                const sample = await model.findOne({});
                
                // Check for new fields
                const hasIsPublic = sample.hasOwnProperty('isPublic');
                const hasForkCount = sample.hasOwnProperty('forkCount');
                const hasForkedFrom = sample.hasOwnProperty('forkedFrom');
                const hasOwnerName = sample.hasOwnProperty('ownerName');

                console.log(`✓ isPublic field: ${hasIsPublic ? '✓ Present' : '✗ Missing'} (value: ${sample.isPublic})`);
                console.log(`✓ forkCount field: ${hasForkCount ? '✓ Present' : '✗ Missing'} (value: ${sample.forkCount})`);
                console.log(`✓ forkedFrom field: ${hasForkedFrom ? '✓ Present' : '✗ Missing'}`);
                console.log(`✓ ownerName field: ${hasOwnerName ? '✓ Present' : '✗ Missing'} (value: "${sample.ownerName}")`);

                if (hasForkedFrom && sample.forkedFrom) {
                    console.log(`  - forkedFrom.contentId: ${sample.forkedFrom.contentId}`);
                    console.log(`  - forkedFrom.originalOwnerId: ${sample.forkedFrom.originalOwnerId}`);
                    console.log(`  - forkedFrom.originalOwnerName: ${sample.forkedFrom.originalOwnerName}`);
                    console.log(`  - forkedFrom.forkedAt: ${sample.forkedFrom.forkedAt}`);
                }

                // Check indexes
                const indexes = await model.collection.getIndexes();
                const hasPublicIndex = Object.keys(indexes).some(key => 
                    key.includes('isPublic')
                );
                console.log(`✓ Public content index: ${hasPublicIndex ? '✓ Present' : '✗ Missing'}`);
            } else {
                console.log('No documents found - skipping field verification');
            }
        }

        console.log('\n=== Verification Complete ===');

    } catch (error) {
        console.error('Verification failed:', error);
        throw error;
    }
}

// Run verification
(async () => {
    try {
        await connectDB();
        await verifySchema();
        console.log('\nClosing database connection...');
        await mongoose.connection.close();
        console.log('Verification complete. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('Verification error:', error);
        process.exit(1);
    }
})();
