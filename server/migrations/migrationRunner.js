#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { migrateCourseSchema, rollbackMigration, verifyMigration } from './course-schema-migration.js';

// Load environment variables
dotenv.config();

/**
 * Migration CLI Runner
 * Provides command-line interface for running migrations
 */

class MigrationRunner {
    constructor() {
        this.connected = false;
    }
    
    async connect() {
        if (this.connected) return;
        
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aicourse';
        await mongoose.connect(mongoUri);
        this.connected = true;
        console.log('Connected to MongoDB');
    }
    
    async disconnect() {
        if (this.connected) {
            await mongoose.disconnect();
            this.connected = false;
            console.log('Disconnected from MongoDB');
        }
    }
    
    /**
     * Run migration with progress tracking
     */
    async runMigration(options = {}) {
        await this.connect();
        
        const startTime = Date.now();
        let lastProgress = 0;
        
        const progressCallback = (progress) => {
            const percent = Math.round((progress.processed / progress.total) * 100);
            if (percent > lastProgress) {
                console.log(`Progress: ${percent}% (${progress.processed}/${progress.total}) - Current: ${progress.current}`);
                lastProgress = percent;
            }
        };
        
        try {
            const result = await migrateCourseSchema({
                ...options,
                progressCallback
            });
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            console.log(`\nMigration completed in ${duration} seconds`);
            console.log(`Success rate: ${Math.round((result.migrated / result.processed) * 100)}%`);
            
            return result;
        } catch (error) {
            console.error('Migration failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Run dry run migration
     */
    async runDryRun(options = {}) {
        console.log('Running migration dry run...');
        return await this.runMigration({ ...options, dryRun: true });
    }
    
    /**
     * Rollback migration
     */
    async runRollback() {
        await this.connect();
        
        console.log('Rolling back migration...');
        const result = await rollbackMigration();
        console.log('Rollback completed');
        
        return result;
    }
    
    /**
     * Verify migration integrity
     */
    async runVerification() {
        await this.connect();
        
        console.log('Verifying migration integrity...');
        const result = await verifyMigration();
        
        if (result.success) {
            console.log('✅ Migration verification passed');
        } else {
            console.log('❌ Migration verification failed');
            result.issues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        }
        
        return result;
    }
    
    /**
     * Get migration status
     */
    async getStatus() {
        await this.connect();
        
        const { Course, Section } = await import('../models/index.js');
        
        const totalCourses = await Course.countDocuments();
        const migratedCourses = await Course.countDocuments({ 'stats.totalSections': { $exists: true } });
        const totalSections = await Section.countDocuments();
        
        const status = {
            totalCourses,
            migratedCourses,
            pendingCourses: totalCourses - migratedCourses,
            totalSections,
            migrationComplete: migratedCourses === totalCourses
        };
        
        console.log('Migration Status:');
        console.log(`  Total Courses: ${status.totalCourses}`);
        console.log(`  Migrated: ${status.migratedCourses}`);
        console.log(`  Pending: ${status.pendingCourses}`);
        console.log(`  Total Sections: ${status.totalSections}`);
        console.log(`  Status: ${status.migrationComplete ? '✅ Complete' : '⏳ In Progress'}`);
        
        return status;
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const runner = new MigrationRunner();
    
    try {
        switch (command) {
            case 'migrate':
                const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1]) || 10;
                const courseIds = args.find(arg => arg.startsWith('--courses='))?.split('=')[1]?.split(',');
                
                await runner.runMigration({ batchSize, courseIds });
                break;
                
            case 'dry-run':
                await runner.runDryRun();
                break;
                
            case 'rollback':
                const confirmed = args.includes('--confirm');
                if (!confirmed) {
                    console.log('⚠️  Rollback will delete all sections and reset courses to original state');
                    console.log('Use --confirm flag to proceed');
                    process.exit(1);
                }
                await runner.runRollback();
                break;
                
            case 'verify':
                await runner.runVerification();
                break;
                
            case 'status':
                await runner.getStatus();
                break;
                
            default:
                console.log('Usage: node migrationRunner.js <command> [options]');
                console.log('');
                console.log('Commands:');
                console.log('  migrate [--batch=10] [--courses=id1,id2]  Run migration');
                console.log('  dry-run                                   Run migration without saving');
                console.log('  rollback --confirm                       Rollback migration');
                console.log('  verify                                    Verify migration integrity');
                console.log('  status                                    Show migration status');
                console.log('');
                console.log('Options:');
                console.log('  --batch=N        Process N courses at a time (default: 10)');
                console.log('  --courses=ids    Migrate specific course IDs (comma-separated)');
                console.log('  --confirm        Confirm destructive operations');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await runner.disconnect();
    }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default MigrationRunner;