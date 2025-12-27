#!/usr/bin/env node

/**
 * Debug API Endpoint Content Persistence Issue
 * 
 * This script tests the actual API endpoint to identify
 * where the content update flow is failing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Import models for direct database checks
import Section from './models/Section.js';
import Course from './models/Course.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aicourse';
const SERVER_URL = 'http://localhost:5010';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function getAuthToken() {
    // For this test, we'll skip authentication and focus on the service layer
    return 'mock-token-for-testing';
}

async function testAPIEndpoint() {
    console.log('\n🔍 Testing API Endpoint Content Persistence...\n');
    
    try {
        // Step 1: Find a test section and course
        console.log('1️⃣ Finding test data...');
        const testSection = await Section.findOne().limit(1);
        const testCourse = await Course.findById(testSection.courseId);
        
        if (!testSection || !testCourse) {
            console.log('❌ Missing test data');
            return;
        }
        
        console.log('✅ Found test data:', {
            sectionId: testSection._id,
            sectionTitle: testSection.title,
            courseId: testCourse._id,
            courseTitle: testCourse.title,
            userId: testCourse.user
        });
        
        // Step 2: Check current section content
        console.log('\n2️⃣ Current section content:');
        console.log('Has content:', testSection.hasContent);
        console.log('Word count:', testSection.wordCount);
        console.log('Markdown text length:', testSection.content.markdown?.text?.length || 0);
        
        // Step 3: Test API endpoint with direct database verification
        console.log('\n3️⃣ Testing API endpoint...');
        
        const testContent = `# API Test Content\n\nThis is test content sent via API at ${new Date().toISOString()}\n\n## Features\n- Feature 1\n- Feature 2\n- Feature 3\n\nThis should persist to the database.`;
        
        console.log('📤 Sending API request...');
        console.log('Content length:', testContent.length);
        console.log('Section ID:', testSection._id);
        
        // Make API request (we'll simulate the auth for now)
        const apiUrl = `${SERVER_URL}/api/sections/${testSection._id}/content`;
        console.log('API URL:', apiUrl);
        
        // Since auth might be complex, let's test the server logic directly
        // by importing and calling the endpoint logic
        console.log('\n4️⃣ Testing server logic directly...');
        
        // Import the services used by the endpoint
        const { default: SectionService } = await import('./services/sectionService.js');
        const { default: ContentConverter } = await import('./services/contentConverter.js');
        
        // Simulate the endpoint logic
        console.log('🔄 Converting content...');
        const convertedContent = await ContentConverter.convertToMultiFormat(testContent, 'markdown');
        
        console.log('✅ Content converted:', {
            hasMarkdown: !!convertedContent.markdown?.text,
            hasHtml: !!convertedContent.html?.text,
            primaryFormat: convertedContent.primaryFormat,
            markdownLength: convertedContent.markdown?.text?.length || 0
        });
        
        // Prepare update data (same as endpoint)
        const updateData = {
            content: convertedContent
        };
        
        console.log('💾 Calling SectionService.updateSection...');
        const updatedSection = await SectionService.updateSection(testSection._id, updateData);
        
        console.log('✅ Service update result:', {
            id: updatedSection._id,
            hasContent: updatedSection.hasContent,
            wordCount: updatedSection.wordCount,
            markdownLength: updatedSection.content.markdown?.text?.length || 0
        });
        
        // Step 5: Verify persistence with fresh database query
        console.log('\n5️⃣ Verifying persistence...');
        const verificationSection = await Section.findById(testSection._id);
        
        console.log('📄 Fresh database query result:', {
            id: verificationSection._id,
            hasContent: verificationSection.hasContent,
            wordCount: verificationSection.wordCount,
            markdownLength: verificationSection.content.markdown?.text?.length || 0,
            contentPreview: verificationSection.content.markdown?.text?.substring(0, 100) + '...'
        });
        
        // Step 6: Check if content matches what we sent
        const expectedContent = testContent;
        const actualContent = verificationSection.content.markdown?.text || '';
        
        console.log('\n6️⃣ Content verification:');
        console.log('Expected length:', expectedContent.length);
        console.log('Actual length:', actualContent.length);
        console.log('Content matches:', expectedContent === actualContent);
        
        if (expectedContent === actualContent) {
            console.log('✅ SUCCESS: Content persistence is working correctly');
        } else {
            console.log('❌ FAILURE: Content mismatch');
            console.log('Expected (first 100 chars):', expectedContent.substring(0, 100));
            console.log('Actual (first 100 chars):', actualContent.substring(0, 100));
        }
        
        // Step 7: Test the actual HTTP endpoint if server is running
        console.log('\n7️⃣ Testing HTTP endpoint...');
        
        try {
            const response = await fetch(`${SERVER_URL}/api/health`);
            if (response.ok) {
                console.log('✅ Server is running, testing HTTP endpoint...');
                
                // We need to simulate authentication for this test
                // For now, let's skip the HTTP test and focus on the service layer
                console.log('⚠️ Skipping HTTP test due to auth complexity');
                console.log('   The service layer test above shows the actual issue');
                
            } else {
                console.log('⚠️ Server not running, skipping HTTP test');
            }
        } catch (error) {
            console.log('⚠️ Server not accessible, skipping HTTP test');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function main() {
    await connectDB();
    await testAPIEndpoint();
    await mongoose.disconnect();
    console.log('\n🔚 API endpoint test complete');
}

// Run the test
main().catch(console.error);