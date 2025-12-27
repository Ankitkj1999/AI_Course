/**
 * Simple Course Creation Test
 * Test the course creation with minimal data to isolate the issue
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5010';
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A'
};

async function testSimpleCourse() {
    console.log('🧪 Simple Course Creation Test\n');
    
    // Test 1: Check server status
    try {
        console.log('1. Checking server status...');
        const statusResponse = await axios.get(`${BASE_URL}/api/courses?userId=${testAuth.userId}&page=1&limit=1`, {
            headers: { 'Cookie': `auth_token=${testAuth.authToken}` },
            withCredentials: true,
            timeout: 5000
        });
        console.log('✅ Server is responding');
    } catch (error) {
        console.error('❌ Server not responding:', error.message);
        return;
    }
    
    // Test 2: Test with minimal valid JSON content
    try {
        console.log('\n2. Testing course creation with minimal content...');
        
        const minimalContent = '{"Test": [{"title": "Section", "subtopics": []}]}';
        
        console.log('Request details:');
        console.log('- URL:', `${BASE_URL}/api/course`);
        console.log('- Method: POST');
        console.log('- Content:', minimalContent);
        
        const response = await axios.post(
            `${BASE_URL}/api/course`,
            {
                user: testAuth.userId,
                mainTopic: 'Simple Test',
                type: 'Text & Image Course',
                content: minimalContent,
                lang: 'english',
                isPublic: false
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth_token=${testAuth.authToken}`
                },
                withCredentials: true,
                timeout: 30000,
                validateStatus: function (status) {
                    return status < 600; // Don't throw for any status < 600
                }
            }
        );
        
        console.log('Response received:');
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);
        console.log('- Headers:', Object.keys(response.headers));
        console.log('- Data:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Course creation successful');
        } else {
            console.log('❌ Course creation failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Request failed completely:', error.message);
        if (error.code) {
            console.error('   Error code:', error.code);
        }
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
    }
}

testSimpleCourse();