/**
 * Test script for access control on content retrieval endpoints
 * This script tests the enhanced GET endpoints with visibility checks
 */

import axios from 'axios';

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5010';

// Test configuration - update these with actual values from your database
const testConfig = {
    // Content that should be public
    publicQuizSlug: 'test-public-quiz',
    publicFlashcardSlug: 'test-public-flashcard',
    publicGuideSlug: 'test-public-guide',
    publicCourseSlug: 'test-public-course',
    
    // Content that should be private
    privateQuizSlug: 'test-private-quiz',
    privateFlashcardSlug: 'test-private-flashcard',
    privateGuideSlug: 'test-private-guide',
    privateCourseSlug: 'test-private-course',
    
    // Owner auth token (for accessing private content)
    ownerAuthToken: 'owner-auth-token-here',
    
    // Owner user ID
    ownerUserId: 'owner-user-id-here'
};

async function testAccessControl() {
    console.log('🧪 Testing Access Control on Content Retrieval Endpoints\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Access public quiz without authentication
    await runTest(
        results,
        'Access public quiz without auth',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/quiz/${testConfig.publicQuizSlug}`
            );
            return response.status === 200 && response.data.success === true;
        }
    );
    
    // Test 2: Access private quiz without authentication (should fail)
    await runTest(
        results,
        'Access private quiz without auth (should return 403)',
        async () => {
            try {
                await axios.get(
                    `${BASE_URL}/api/quiz/${testConfig.privateQuizSlug}`
                );
                return false; // Should not succeed
            } catch (error) {
                return error.response?.status === 403;
            }
        }
    );
    
    // Test 3: Access private quiz with owner authentication
    await runTest(
        results,
        'Access private quiz with owner auth',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/quiz/${testConfig.privateQuizSlug}`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.ownerAuthToken}`
                    },
                    withCredentials: true
                }
            );
            return response.status === 200 && response.data.success === true;
        }
    );
    
    // Test 4: Get user quizzes with visibility filter (all)
    await runTest(
        results,
        'Get user quizzes with visibility=all',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/quizzes?userId=${testConfig.ownerUserId}&visibility=all`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.ownerAuthToken}`
                    },
                    withCredentials: true
                }
            );
            return response.status === 200 && response.data.success === true;
        }
    );
    
    // Test 5: Get user quizzes with visibility filter (public)
    await runTest(
        results,
        'Get user quizzes with visibility=public',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/quizzes?userId=${testConfig.ownerUserId}&visibility=public`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.ownerAuthToken}`
                    },
                    withCredentials: true
                }
            );
            return response.status === 200 && 
                   response.data.success === true &&
                   response.data.data.every(quiz => quiz.isPublic === true);
        }
    );
    
    // Test 6: Get user quizzes with visibility filter (private)
    await runTest(
        results,
        'Get user quizzes with visibility=private',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/quizzes?userId=${testConfig.ownerUserId}&visibility=private`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.ownerAuthToken}`
                    },
                    withCredentials: true
                }
            );
            return response.status === 200 && 
                   response.data.success === true &&
                   response.data.data.every(quiz => quiz.isPublic === false);
        }
    );
    
    // Test 7: Verify visibility fields are included in response
    await runTest(
        results,
        'Verify visibility fields in quiz response',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/quiz/${testConfig.publicQuizSlug}`
            );
            const quiz = response.data.quiz;
            return quiz.hasOwnProperty('isPublic') && 
                   quiz.hasOwnProperty('forkCount') &&
                   quiz.hasOwnProperty('ownerName');
        }
    );
    
    // Test 8: Access public flashcard without authentication
    await runTest(
        results,
        'Access public flashcard without auth',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/flashcard/${testConfig.publicFlashcardSlug}`
            );
            return response.status === 200 && response.data.success === true;
        }
    );
    
    // Test 9: Access private flashcard without authentication (should fail)
    await runTest(
        results,
        'Access private flashcard without auth (should return 403)',
        async () => {
            try {
                await axios.get(
                    `${BASE_URL}/api/flashcard/${testConfig.privateFlashcardSlug}`
                );
                return false;
            } catch (error) {
                return error.response?.status === 403;
            }
        }
    );
    
    // Test 10: Access public guide without authentication
    await runTest(
        results,
        'Access public guide without auth',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/guide/${testConfig.publicGuideSlug}`
            );
            return response.status === 200 && response.data.success === true;
        }
    );
    
    // Test 11: Access private guide without authentication (should fail)
    await runTest(
        results,
        'Access private guide without auth (should return 403)',
        async () => {
            try {
                await axios.get(
                    `${BASE_URL}/api/guide/${testConfig.privateGuideSlug}`
                );
                return false;
            } catch (error) {
                return error.response?.status === 403;
            }
        }
    );
    
    // Test 12: Access public course without authentication
    await runTest(
        results,
        'Access public course without auth',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/course/${testConfig.publicCourseSlug}`
            );
            return response.status === 200 && response.data.success === true;
        }
    );
    
    // Test 13: Access private course without authentication (should fail)
    await runTest(
        results,
        'Access private course without auth (should return 403)',
        async () => {
            try {
                await axios.get(
                    `${BASE_URL}/api/course/${testConfig.privateCourseSlug}`
                );
                return false;
            } catch (error) {
                return error.response?.status === 403;
            }
        }
    );
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.tests.length}`);
    console.log('='.repeat(60));
    
    if (results.failed > 0) {
        console.log('\nFailed tests:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  ❌ ${t.name}: ${t.error}`));
    }
}

async function runTest(results, name, testFn) {
    try {
        console.log(`Running: ${name}...`);
        const passed = await testFn();
        if (passed) {
            console.log(`✅ ${name}\n`);
            results.passed++;
            results.tests.push({ name, passed: true });
        } else {
            console.log(`❌ ${name} - Test returned false\n`);
            results.failed++;
            results.tests.push({ name, passed: false, error: 'Test returned false' });
        }
    } catch (error) {
        console.log(`❌ ${name} - ${error.message}\n`);
        results.failed++;
        results.tests.push({ name, passed: false, error: error.message });
    }
}

// Instructions
console.log('Manual testing instructions:');
console.log('1. Start the server: npm start');
console.log('2. Create test content (public and private) in the database');
console.log('3. Update testConfig with actual slugs, userId, and auth token');
console.log('4. Uncomment the testAccessControl() call below');
console.log('5. Run: node test-access-control.js\n');

// Uncomment to run tests
// testAccessControl();
