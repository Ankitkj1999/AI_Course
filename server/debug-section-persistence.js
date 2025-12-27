#!/usr/bin/env node

/**
 * Debug Section Content Persistence Issue
 * 
 * This script tests the section content update flow to identify
 * why content updates return success but don't persist to database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models and services
import Section from './models/Section.js';
import SectionService from './services/sectionService.js';
import ContentConverter from './services/contentConverter.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aicourse';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function debugSectionPersistence() {
    console.log('\n🔍 Starting Section Content Persistence Debug...\n');
    
    try {
        // Step 1: Find a test section
        console.log('1️⃣ Finding a test section...');
        const testSection = await Section.findOne().limit(1);
        
        if (!testSection) {
            console.log('❌ No sections found in database');
            return;
        }
        
        console.log('✅ Found test section:', {
            id: testSection._id,
            title: testSection.title,
            courseId: testSection.courseId,
            hasContent: testSection.hasContent,
            wordCount: testSection.wordCount
        });
        
        // Step 2: Check current content structure
        console.log('\n2️⃣ Current content structure:');
        console.log(JSON.stringify(testSection.content, null, 2));
        
        // Step 3: Test ContentConverter
        console.log('\n3️⃣ Testing ContentConverter...');
        const testContent = "# Test Content\n\nThis is a test content update to debug persistence issues.\n\n- Item 1\n- Item 2\n- Item 3";
        const convertedContent = await ContentConverter.convertToMultiFormat(testContent, 'markdown');
        
        console.log('✅ Content converted:', {
            hasMarkdown: !!convertedContent.markdown?.text,
            hasHtml: !!convertedContent.html?.text,
            primaryFormat: convertedContent.primaryFormat,
            markdownLength: convertedContent.markdown?.text?.length || 0,
            htmlLength: convertedContent.html?.text?.length || 0
        });
        
        // Step 4: Test direct Section model update
        console.log('\n4️⃣ Testing direct Section model update...');
        
        // Store original content for comparison
        const originalContent = JSON.parse(JSON.stringify(testSection.content));
        
        // Update using direct model assignment
        testSection.content = convertedContent;
        testSection.markModified('content'); // Explicitly mark as modified
        
        console.log('💾 Saving section with markModified...');
        const savedSection = await testSection.save();
        
        console.log('✅ Section saved, checking result:', {
            id: savedSection._id,
            hasContent: savedSection.hasContent,
            wordCount: savedSection.wordCount,
            contentStructure: {
                hasMarkdown: !!savedSection.content.markdown?.text,
                hasHtml: !!savedSection.content.html?.text,
                primaryFormat: savedSection.content.primaryFormat
            }
        });
        
        // Step 5: Verify persistence by re-fetching from database
        console.log('\n5️⃣ Re-fetching from database to verify persistence...');
        const refetchedSection = await Section.findById(testSection._id);
        
        console.log('📄 Refetched section:', {
            id: refetchedSection._id,
            hasContent: refetchedSection.hasContent,
            wordCount: refetchedSection.wordCount,
            contentStructure: {
                hasMarkdown: !!refetchedSection.content.markdown?.text,
                hasHtml: !!refetchedSection.content.html?.text,
                primaryFormat: refetchedSection.content.primaryFormat,
                markdownText: refetchedSection.content.markdown?.text?.substring(0, 100) + '...'
            }
        });
        
        // Step 6: Test SectionService.updateSection method
        console.log('\n6️⃣ Testing SectionService.updateSection method...');
        
        const updateData = {
            content: convertedContent
        };
        
        console.log('🔄 Calling SectionService.updateSection...');
        const serviceUpdatedSection = await SectionService.updateSection(testSection._id, updateData);
        
        console.log('✅ SectionService update result:', {
            id: serviceUpdatedSection._id,
            hasContent: serviceUpdatedSection.hasContent,
            wordCount: serviceUpdatedSection.wordCount,
            contentStructure: {
                hasMarkdown: !!serviceUpdatedSection.content.markdown?.text,
                hasHtml: !!serviceUpdatedSection.content.html?.text,
                primaryFormat: serviceUpdatedSection.content.primaryFormat
            }
        });
        
        // Step 7: Final verification
        console.log('\n7️⃣ Final database verification...');
        const finalSection = await Section.findById(testSection._id);
        
        console.log('🏁 Final section state:', {
            id: finalSection._id,
            hasContent: finalSection.hasContent,
            wordCount: finalSection.wordCount,
            contentPersisted: !!finalSection.content.markdown?.text && finalSection.content.markdown.text.length > 0
        });
        
        // Step 8: Compare original vs final
        console.log('\n8️⃣ Content comparison:');
        console.log('Original content length:', JSON.stringify(originalContent).length);
        console.log('Final content length:', JSON.stringify(finalSection.content).length);
        console.log('Content actually changed:', JSON.stringify(originalContent) !== JSON.stringify(finalSection.content));
        
        if (finalSection.content.markdown?.text && finalSection.content.markdown.text.includes('Test Content')) {
            console.log('✅ SUCCESS: Content was properly persisted to database');
        } else {
            console.log('❌ FAILURE: Content was not persisted to database');
            console.log('Expected content to include "Test Content"');
            console.log('Actual markdown text:', finalSection.content.markdown?.text || 'null');
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function main() {
    await connectDB();
    await debugSectionPersistence();
    await mongoose.disconnect();
    console.log('\n🔚 Debug complete');
}

// Run the debug script
main().catch(console.error);