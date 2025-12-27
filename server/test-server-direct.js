/**
 * Test Server Endpoints Directly
 * This script tests the server endpoints to see what's causing the 500 errors
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5010';

// Real test credentials
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A',
    email: 'test@example.com'
};

async function testServerEndpoints() {
    console.log('🧪 Testing Server Endpoints Directly\n');
    
    // Test 1: Check if server is running
    try {
        console.log('1. Testing server connectivity...');
        const response = await axios.get(`${BASE_URL}/api/courses?userId=${testAuth.userId}&page=1&limit=5`, {
            headers: {
                'Cookie': `auth_token=${testAuth.authToken}`
            },
            withCredentials: true,
            timeout: 5000
        });
        console.log('✅ Server is running and responding');
        console.log(`   Status: ${response.status}`);
        console.log(`   Courses: ${response.data.courses?.length || 0}`);
    } catch (error) {
        console.error('❌ Server connectivity failed:', error.message);
        return;
    }
    
    // Test 2: Test /api/generate with detailed error logging
    try {
        console.log('\n2. Testing /api/generate endpoint...');
        const response = await axios.post(
            `${BASE_URL}/api/generate`,
            {
                prompt: 'Hello world test',
                provider: 'gemini',
                model: 'gemini-2.5-flash',
                temperature: 0.7
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
        
        console.log('✅ /api/generate successful');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response keys: ${Object.keys(response.data)}`);
        console.log(`   Text length: ${response.data.text?.length || 0}`);
        console.log(`   Content type: ${response.data.contentType}`);
        
    } catch (error) {
        console.error('❌ /api/generate failed');
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Status text: ${error.response?.statusText}`);
        console.error(`   Response data:`, error.response?.data);
        console.error(`   Error message: ${error.message}`);
        
        // Try to get more details from response
        if (error.response?.data) {
            console.log('\n   Full error response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
    }
    
    // Test 3: Generate course content first
    let generatedContent = null;
    try {
        console.log('\n3. Generating course content...');
        const contentResponse = await axios.post(
            `${BASE_URL}/api/generate`,
            {
                prompt: 'Create a course outline for "JavaScript Testing Fundamentals". Return ONLY valid JSON in this exact format: {"JavaScript Testing Fundamentals": [{"title": "Introduction to Testing", "subtopics": [{"title": "What is Testing?", "theory": "Testing ensures code quality and reliability."}]}]}',
                provider: 'gemini',
                temperature: 0.3
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth_token=${testAuth.authToken}`
                },
                withCredentials: true,
                timeout: 60000 // Increased timeout
            }
        );
        
        generatedContent = contentResponse.data.text;
        console.log('✅ Course content generated');
        console.log(`   Content length: ${generatedContent.length} characters`);
        console.log(`   Content preview: ${generatedContent.substring(0, 200)}...`);
        
    } catch (error) {
        console.error('❌ Content generation failed:', error.message);
        return;
    }
    
    // Test 4: Test /api/course endpoint with generated content
    try {
        console.log('\n4. Testing /api/course endpoint with generated content...');
        const response = await axios.post(
            `${BASE_URL}/api/course`,
            {
                user: testAuth.userId,
                mainTopic: 'JavaScript Testing Fundamentals',
                type: 'Text & Image Course',
                content: generatedContent,
                lang: 'english',
                isPublic: false
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
        
        console.log('✅ /api/course successful');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response keys: ${Object.keys(response.data)}`);
        console.log(`   Course ID: ${response.data.courseId}`);
        console.log(`   Course slug: ${response.data.slug}`);
        console.log(`   Sections created: ${response.data.sectionsCreated}`);
        console.log(`   Architecture: ${response.data.architecture}`);
        
    } catch (error) {
        console.error('❌ /api/course failed');
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Status text: ${error.response?.statusText}`);
        console.error(`   Response data:`, error.response?.data);
        console.error(`   Error message: ${error.message}`);
        
        // Try to get more details from response
        if (error.response?.data) {
            console.log('\n   Full error response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
    }
}

testServerEndpoints();