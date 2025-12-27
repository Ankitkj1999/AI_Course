/**
 * Simple Course API Tests
 * Basic functionality tests that can be run without complex authentication setup
 * Tests the core endpoints to ensure they respond correctly
 */

import axios from 'axios';

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5010';

async function testBasicCourseAPIs() {
    console.log('🧪 Testing Basic Course API Functionality\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Check if server is running
    await runTest(
        results,
        'Server health check',
        async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/health`, {
                    timeout: 5000
                });
                return response.status === 200;
            } catch (error) {
                // If no health endpoint, try a basic endpoint
                try {
                    const response = await axios.get(`${BASE_URL}/`, {
                        timeout: 5000
                    });
                    return response.status === 200;
                } catch (fallbackError) {
                    throw new Error(`Server not responding: ${fallbackError.message}`);
                }
            }
        }
    );
    
    // Test 2: Test content generation endpoint (without auth)
    await runTest(
        results,
        'Content generation endpoint structure',
        async () => {
            try {
                const response = await axios.post(
                    `${BASE_URL}/api/generate`,
                    {
                        prompt: 'Test prompt for API structure validation',
                        provider: 'openai',
                        model: 'gpt-3.5-turbo',
                        temperature: 0.7
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );
                
                // Should return 401 (unauthorized) or 200 (success)
                // We're testing the endpoint exists and handles requests properly
                return response.status === 200 || response.status === 401;
            } catch (error) {
                // 401 Unauthorized is expected without auth
                if (error.response?.status === 401) {
                    console.log('   ✅ Endpoint exists (returns 401 as expected without auth)');
                    return true;
                }
                // 500 or other errors indicate problems
                throw error;
            }
        }
    );
    
    // Test 3: Test course creation endpoint structure
    await runTest(
        results,
        'Course creation endpoint structure',
        async () => {
            try {
                const response = await axios.post(
                    `${BASE_URL}/api/course`,
                    {
                        topic: 'Test Course',
                        type: 'text course',
                        language: 'english'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );
                
                return response.status === 200 || response.status === 401;
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('   ✅ Endpoint exists (returns 401 as expected without auth)');
                    return true;
                }
                throw error;
            }
        }
    );
    
    // Test 4: Test hierarchy endpoint structure (with dummy ID)
    await runTest(
        results,
        'Hierarchy endpoint structure',
        async () => {
            try {
                const dummyId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
                const response = await axios.get(
                    `${BASE_URL}/api/v2/courses/${dummyId}/hierarchy`,
                    {
                        timeout: 10000
                    }
                );
                
                return response.status === 200 || response.status === 401 || response.status === 404;
            } catch (error) {
                // 401, 404, or 403 are expected responses
                if ([401, 404, 403].includes(error.response?.status)) {
                    console.log(`   ✅ Endpoint exists (returns ${error.response.status} as expected)`);
                    return true;
                }
                throw error;
            }
        }
    );
    
    // Test 5: Test progress endpoint structure
    await runTest(
        results,
        'Progress endpoint structure',
        async () => {
            try {
                const dummyId = '507f1f77bcf86cd799439011';
                const response = await axios.get(
                    `${BASE_URL}/api/course/${dummyId}/progress`,
                    {
                        timeout: 10000
                    }
                );
                
                return response.status === 200 || response.status === 401 || response.status === 404;
            } catch (error) {
                if ([401, 404, 403].includes(error.response?.status)) {
                    console.log(`   ✅ Endpoint exists (returns ${error.response.status} as expected)`);
                    return true;
                }
                throw error;
            }
        }
    );
    
    // Test 6: Test section content endpoint structure
    await runTest(
        results,
        'Section content endpoint structure',
        async () => {
            try {
                const dummyId = '507f1f77bcf86cd799439011';
                const response = await axios.post(
                    `${BASE_URL}/api/sections/${dummyId}/content`,
                    {
                        content: 'Test content',
                        contentType: 'markdown'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );
                
                return response.status === 200 || response.status === 401 || response.status === 404;
            } catch (error) {
                if ([401, 404, 403].includes(error.response?.status)) {
                    console.log(`   ✅ Endpoint exists (returns ${error.response.status} as expected)`);
                    return true;
                }
                throw error;
            }
        }
    );
    
    // Test 7: Test courses list endpoint structure
    await runTest(
        results,
        'Courses list endpoint structure',
        async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}/api/courses?page=1&limit=5`,
                    {
                        timeout: 10000
                    }
                );
                
                return response.status === 200 || response.status === 401;
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('   ✅ Endpoint exists (returns 401 as expected without auth)');
                    return true;
                }
                throw error;
            }
        }
    );
    
    // Test 8: Test course by slug endpoint structure
    await runTest(
        results,
        'Course by slug endpoint structure',
        async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}/api/course/test-course-slug`,
                    {
                        timeout: 10000
                    }
                );
                
                return response.status === 200 || response.status === 401 || response.status === 404;
            } catch (error) {
                if ([401, 404, 403].includes(error.response?.status)) {
                    console.log(`   ✅ Endpoint exists (returns ${error.response.status} as expected)`);
                    return true;
                }
                throw error;
            }
        }
    );
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Basic Course API Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.tests.length}`);
    console.log('='.repeat(60));
    
    if (results.failed > 0) {
        console.log('\nFailed tests:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  ❌ ${t.name}: ${t.error}`));
    } else {
        console.log('\n🎉 All basic API endpoints are responding correctly!');
        console.log('The server appears to be running and handling requests properly.');
    }
    
    console.log('\nNext Steps:');
    console.log('1. For full functionality testing, use test-course-apis.js with proper auth');
    console.log('2. Check server logs for any errors during these tests');
    console.log('3. Verify database connectivity if endpoints return unexpected errors');
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
console.log('Simple Course API Testing:');
console.log('1. Start the server: npm start');
console.log('2. Run: node test-course-apis-simple.js');
console.log('3. This tests basic endpoint availability without authentication\n');

// Run the tests automatically
testBasicCourseAPIs();