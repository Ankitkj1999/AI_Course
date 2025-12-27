/**
 * Test Markdown Content Parsing
 * Test the exact content that was failing
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5010';
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A'
};

async function testMarkdownContent() {
    console.log('🧪 Testing Markdown Content Parsing\n');
    
    // Test the exact content that was failing
    const problematicContent = '```json\n{"Test Course": [{"title": "Section 1", "subtopics": [{"title": "Topic 1", "theory": "Content here"}]}]}\n```';
    
    console.log('Testing with problematic content:');
    console.log('---START---');
    console.log(problematicContent);
    console.log('---END---');
    console.log('Length:', problematicContent.length);
    console.log('Has newlines:', problematicContent.includes('\n'));
    
    try {
        const response = await axios.post(
            `${BASE_URL}/api/course`,
            {
                user: testAuth.userId,
                mainTopic: 'Markdown Test',
                type: 'Text & Image Course',
                content: problematicContent,
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
                    return status < 600;
                }
            }
        );
        
        console.log('\nResponse:');
        console.log('- Status:', response.status);
        console.log('- Data:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Success! The markdown content parsing is working');
        } else {
            console.log('❌ Failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
    }
}

testMarkdownContent();