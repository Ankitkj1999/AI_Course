#!/usr/bin/env node

/**
 * Test Section Content API Endpoint
 * 
 * This script tests the actual HTTP endpoint for section content updates
 * to confirm the persistence fix is working end-to-end
 */

import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
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

async function testSectionContentAPI() {
    console.log('\n🧪 Testing Section Content API Endpoint...\n');
    
    try {
        // Step 1: Get test user credentials
        console.log('1️⃣ Setting up test authentication...');
        const testEmail = 'test@example.com';
        const testPassword = 'password123';
        
        // Login to get auth token
        const loginResponse = await fetch(`${SERVER_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed');
            const errorText = await loginResponse.text();
            console.log('Error:', errorText);
            return;
        }
        
        const loginData = await loginResponse.json();
        const authToken = loginData.token;
        console.log('✅ Authentication successful');
        
        // Step 2: Find a test section owned by this user
        console.log('\n2️⃣ Finding test section...');
        const testCourse = await Course.findOne({ user: loginData.user._id });
        if (!testCourse) {
            console.log('❌ No courses found for test user');
            return;
        }
        
        const testSection = await Section.findOne({ courseId: testCourse._id });
        if (!testSection) {
            console.log('❌ No sections found for test course');
            return;
        }
        
        console.log('✅ Found test section:', {
            sectionId: testSection._id,
            title: testSection.title,
            courseTitle: testCourse.title
        });
        
        // Step 3: Get current content for comparison
        console.log('\n3️⃣ Getting current content...');
        const beforeContent = testSection.content.markdown?.text || '';
        console.log('Current content length:', beforeContent.length);
        
        // Step 4: Send content update via API
        console.log('\n4️⃣ Sending content update via API...');
        const newContent = `# API Test Content\n\nThis content was updated via HTTP API at ${new Date().toISOString()}\n\n## Test Features\n- HTTP endpoint test\n- Authentication verification\n- Database persistence check\n- Real-world API flow\n\nThis content should persist to the database correctly.`;
        
        const updateResponse = await fetch(`${SERVER_URL}/api/sections/${testSection._id}/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                content: newContent,
                contentType: 'markdown'
            })
        });
        
        if (!updateResponse.ok) {
            console.log('❌ Content update failed');
            const errorText = await updateResponse.text();
            console.log('Error:', errorText);
            return;
        }
        
        const updateData = await updateResponse.json();
        console.log('✅ API response received:', {
            success: updateData.success,
            hasSection: !!updateData.section,
            responseContentLength: updateData.section?.content?.markdown?.text?.length || 0
        });
        
        // Step 5: Verify persistence with fresh database query
        console.log('\n5️⃣ Verifying database persistence...');
        
        // Wait a moment for any async operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const verificationSection = await Section.findById(testSection._id);
        const persistedContent = verificationSection.content.markdown?.text || '';
        
        console.log('📄 Database verification:', {
            sectionId: verificationSection._id,
            hasContent: verificationSection.hasContent,
            wordCount: verificationSection.wordCount,
            contentLength: persistedContent.length,
            contentPreview: persistedContent.substring(0, 100) + '...'
        });
        
        // Step 6: Compare expected vs actual
        console.log('\n6️⃣ Content comparison:');
        console.log('Expected length:', newContent.length);
        console.log('Actual length:', persistedContent.length);
        console.log('Content matches:', newContent === persistedContent);
        
        if (newContent === persistedContent) {
            console.log('✅ SUCCESS: HTTP API content persistence is working correctly!');
        } else {
            console.log('❌ FAILURE: Content mismatch');
            console.log('Expected (first 100 chars):', newContent.substring(0, 100));
            console.log('Actual (first 100 chars):', persistedContent.substring(0, 100));
        }
        
        // Step 7: Test content retrieval
        console.log('\n7️⃣ Testing content retrieval...');
        const getResponse = await fetch(`${SERVER_URL}/api/sections/${testSection._id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (getResponse.ok) {
            const sectionData = await getResponse.json();
            const retrievedContent = sectionData.section?.content?.markdown?.text || '';
            console.log('✅ Content retrieval successful');
            console.log('Retrieved content length:', retrievedContent.length);
            console.log('Retrieval matches update:', retrievedContent === newContent);
        } else {
            console.log('⚠️ Content retrieval endpoint not available');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function main() {
    await connectDB();
    await testSectionContentAPI();
    await mongoose.disconnect();
    console.log('\n🔚 Section Content API test complete');
}

// Run the test
main().catch(console.error);