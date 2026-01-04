/**
 * Test script for visibility management endpoints
 * This script tests the new PATCH and GET endpoints for content visibility
 */

import axios from 'axios';

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5010';

// Test configuration
const testConfig = {
    // You'll need to replace these with actual values from your database
    testUserId: 'test-user-id',
    testSlug: 'test-quiz-slug',
    contentType: 'quiz',
    authToken: 'your-auth-token-here'
};

async function testVisibilityEndpoints() {
    console.log('🧪 Testing Visibility Management Endpoints\n');
    
    try {
        // Test 1: GET visibility status
        console.log('Test 1: GET visibility status');
        console.log(`GET ${BASE_URL}/api/${testConfig.contentType}/${testConfig.testSlug}/visibility`);
        
        const getResponse = await axios.get(
            `${BASE_URL}/api/${testConfig.contentType}/${testConfig.testSlug}/visibility`,
            {
                headers: {
                    'Cookie': `auth_token=${testConfig.authToken}`
                },
                withCredentials: true
            }
        );
        
        console.log('✅ GET Response:', getResponse.data);
        console.log('');
        
        // Test 2: PATCH toggle visibility to public
        console.log('Test 2: PATCH toggle visibility to public');
        console.log(`PATCH ${BASE_URL}/api/${testConfig.contentType}/${testConfig.testSlug}/visibility`);
        
        const patchPublicResponse = await axios.patch(
            `${BASE_URL}/api/${testConfig.contentType}/${testConfig.testSlug}/visibility`,
            { isPublic: true },
            {
                headers: {
                    'Cookie': `auth_token=${testConfig.authToken}`
                },
                withCredentials: true
            }
        );
        
        console.log('✅ PATCH Response (public):', patchPublicResponse.data);
        console.log('');
        
        // Test 3: GET visibility status again to verify change
        console.log('Test 3: GET visibility status after toggle');
        
        const getResponse2 = await axios.get(
            `${BASE_URL}/api/${testConfig.contentType}/${testConfig.testSlug}/visibility`,
            {
                headers: {
                    'Cookie': `auth_token=${testConfig.authToken}`
                },
                withCredentials: true
            }
        );
        
        console.log('✅ GET Response:', getResponse2.data);
        console.log('');
        
        // Test 4: PATCH toggle visibility back to private
        console.log('Test 4: PATCH toggle visibility to private');
        
        const patchPrivateResponse = await axios.patch(
            `${BASE_URL}/api/${testConfig.contentType}/${testConfig.testSlug}/visibility`,
            { isPublic: false },
            {
                headers: {
                    'Cookie': `auth_token=${testConfig.authToken}`
                },
                withCredentials: true
            }
        );
        
        console.log('✅ PATCH Response (private):', patchPrivateResponse.data);
        console.log('');
        
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run tests
console.log('Note: Update testConfig with actual values before running\n');
// testVisibilityEndpoints();

console.log('Manual testing instructions:');
console.log('1. Start the server: npm start');
console.log('2. Update testConfig with actual userId, slug, and auth token');
console.log('3. Uncomment the testVisibilityEndpoints() call above');
console.log('4. Run: node test-visibility-endpoints.js');
