/**
 * Debug Course Creation Process
 * This script tests the complete course creation flow step by step
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5010';
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A'
};

async function debugCourseCreation() {
    console.log('🔍 Debugging Course Creation Process\n');
    
    try {
        // Step 1: Generate content
        console.log('Step 1: Generating content...');
        const contentResponse = await axios.post(
            `${BASE_URL}/api/generate`,
            {
                prompt: 'Return ONLY this JSON: {"Test Course": [{"title": "Section 1", "subtopics": [{"title": "Topic 1", "theory": "Content here"}]}]}',
                provider: 'gemini',
                temperature: 0.1
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth_token=${testAuth.authToken}`
                },
                withCredentials: true,
                timeout: 30000
            }
        );
        
        const generatedContent = contentResponse.data.text;
        console.log('✅ Content generated');
        console.log(`   Length: ${generatedContent.length} characters`);
        console.log(`   Preview: ${generatedContent.substring(0, 100)}...`);
        
        // Step 2: Create course with exact API format
        console.log('\nStep 2: Creating course...');
        console.log('Request payload:');
        const coursePayload = {
            user: testAuth.userId,
            mainTopic: 'Test Course Debug',
            type: 'Text & Image Course',
            content: generatedContent,
            lang: 'english',
            isPublic: false
        };
        console.log(JSON.stringify(coursePayload, null, 2));
        
        const courseResponse = await axios.post(
            `${BASE_URL}/api/course`,
            coursePayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth_token=${testAuth.authToken}`
                },
                withCredentials: true,
                timeout: 60000
            }
        );
        
        console.log('✅ Course created successfully');
        console.log('Response:', JSON.stringify(courseResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error occurred');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
        
        // If it's a server error, let's check the server logs
        if (error.response?.status === 500) {
            console.log('\n🔍 This is a server error. Check the server console for detailed logs.');
        }
    }
}

debugCourseCreation();