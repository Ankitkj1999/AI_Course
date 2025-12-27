#!/usr/bin/env node

/**
 * Test /api/generate endpoint with direct section save
 * 
 * This script tests the enhanced /api/generate endpoint that now:
 * 1. Generates content via LLM
 * 2. Converts to multi-format (Markdown, HTML, Lexical)
 * 3. Saves directly to the specified section
 * 4. Returns the updated section data
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

async function testGenerateWithSave() {
    console.log('\n🧪 Testing /api/generate with Direct Section Save...\n');
    
    try {
        // Step 1: Get test user credentials
        console.log('1️⃣ Setting up test authentication...');
        const testEmail = 'test@example.com';
        const testPassword = 'password123';
        
        // Login to get auth cookie
        const loginResponse = await fetch(`${SERVER_URL}/api/signin`, {
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
            return;
        }
        
        const loginData = await loginResponse.json();
        if (!loginData.success) {
            console.log('❌ Login unsuccessful:', loginData.message);
            return;
        }
        
        // Extract cookie from response
        const cookies = loginResponse.headers.raw()['set-cookie'];
        const authCookie = cookies ? cookies.find(c => c.startsWith('auth_token=')) : null;
        
        if (!authCookie) {
            console.log('❌ No auth cookie received');
            return;
        }
        
        console.log('✅ Authentication successful');
        
        // Step 2: Find a test section
        console.log('\n2️⃣ Finding test section...');
        const testCourse = await Course.findOne({ user: loginData.userData._id });
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
            courseTitle: testCourse.title,
            currentWordCount: testSection.wordCount,
            hasContent: testSection.hasContent
        });
        
        // Step 3: Get current content for comparison
        const beforeContent = testSection.content.markdown?.text || '';
        console.log('Current content length:', beforeContent.length);
        
        // Step 4: Test /api/generate WITHOUT sectionId (backward compatibility)
        console.log('\n3️⃣ Testing /api/generate WITHOUT sectionId (backward compatibility)...');
        
        const generateOnlyResponse = await fetch(`${SERVER_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': authCookie
            },
            body: JSON.stringify({
                prompt: 'Write a brief introduction to databases (2-3 sentences)',
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp'
            })
        });
        
        if (!generateOnlyResponse.ok) {
            console.log('❌ Generate-only request failed');
            const errorText = await generateOnlyResponse.text();
            console.log('Error:', errorText);
        } else {
            const generateOnlyData = await generateOnlyResponse.json();
            console.log('✅ Generate-only successful:', {
                contentLength: generateOnlyData.text?.length || 0,
                provider: generateOnlyData.metadata?.provider,
                savedToSection: generateOnlyData.metadata?.savedToSection
            });
        }
        
        // Step 5: Test /api/generate WITH sectionId (new functionality)
        console.log('\n4️⃣ Testing /api/generate WITH sectionId (new functionality)...');
        
        const testPrompt = `Write a comprehensive introduction to ${testSection.title}. Include:
- What it is
- Why it's important
- Key concepts
- Real-world applications

Make it educational and engaging (about 200 words).`;
        
        console.log('📤 Sending generate request with sectionId...');
        console.log('Prompt:', testPrompt.substring(0, 100) + '...');
        console.log('Section ID:', testSection._id);
        
        const generateWithSaveResponse = await fetch(`${SERVER_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': authCookie
            },
            body: JSON.stringify({
                prompt: testPrompt,
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
                sectionId: testSection._id.toString()
            })
        });
        
        if (!generateWithSaveResponse.ok) {
            console.log('❌ Generate-with-save request failed');
            const errorText = await generateWithSaveResponse.text();
            console.log('Error:', errorText);
            return;
        }
        
        const generateWithSaveData = await generateWithSaveResponse.json();
        console.log('✅ Generate-with-save response received:', {
            success: generateWithSaveData.success,
            contentLength: generateWithSaveData.text?.length || 0,
            provider: generateWithSaveData.metadata?.provider,
            savedToSection: generateWithSaveData.metadata?.savedToSection,
            sectionData: generateWithSaveData.section ? {
                id: generateWithSaveData.section.id,
                title: generateWithSaveData.section.title,
                wordCount: generateWithSaveData.section.wordCount,
                hasContent: generateWithSaveData.section.hasContent
            } : null
        });
        
        // Step 6: Verify persistence with fresh database query
        console.log('\n5️⃣ Verifying database persistence...');
        
        // Wait a moment for any async operations to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const verificationSection = await Section.findById(testSection._id);
        const persistedContent = verificationSection.content.markdown?.text || '';
        
        console.log('📄 Database verification:', {
            sectionId: verificationSection._id,
            title: verificationSection.title,
            hasContent: verificationSection.hasContent,
            wordCount: verificationSection.wordCount,
            contentLength: persistedContent.length,
            contentPreview: persistedContent.substring(0, 150) + '...'
        });
        
        // Step 7: Compare expected vs actual
        console.log('\n6️⃣ Content comparison:');
        console.log('Generated content length:', generateWithSaveData.text?.length || 0);
        console.log('Persisted content length:', persistedContent.length);
        console.log('Content matches:', generateWithSaveData.text === persistedContent);
        
        // Step 8: Verify multi-format conversion
        console.log('\n7️⃣ Verifying multi-format conversion:');
        console.log('Has Markdown:', !!verificationSection.content.markdown?.text);
        console.log('Has HTML:', !!verificationSection.content.html?.text);
        console.log('Has Lexical:', !!verificationSection.content.lexical?.editorState);
        console.log('Primary format:', verificationSection.content.primaryFormat);
        console.log('Markdown length:', verificationSection.content.markdown?.text?.length || 0);
        console.log('HTML length:', verificationSection.content.html?.text?.length || 0);
        
        // Final verdict
        console.log('\n8️⃣ Final verdict:');
        if (generateWithSaveData.text === persistedContent && 
            verificationSection.hasContent && 
            verificationSection.wordCount > 0 &&
            verificationSection.content.markdown?.text &&
            verificationSection.content.html?.text) {
            console.log('✅ SUCCESS: Generate-with-save functionality is working correctly!');
            console.log('   - Content generated by LLM');
            console.log('   - Converted to multi-format (Markdown, HTML, Lexical)');
            console.log('   - Saved directly to section database');
            console.log('   - All formats persisted correctly');
        } else {
            console.log('❌ FAILURE: Issues detected');
            if (generateWithSaveData.text !== persistedContent) {
                console.log('   - Content mismatch between API response and database');
            }
            if (!verificationSection.hasContent) {
                console.log('   - Section hasContent flag is false');
            }
            if (verificationSection.wordCount === 0) {
                console.log('   - Word count is zero');
            }
            if (!verificationSection.content.markdown?.text) {
                console.log('   - Markdown format missing');
            }
            if (!verificationSection.content.html?.text) {
                console.log('   - HTML format missing');
            }
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function main() {
    await connectDB();
    await testGenerateWithSave();
    await mongoose.disconnect();
    console.log('\n🔚 Test complete');
}

// Run the test
main().catch(console.error);
