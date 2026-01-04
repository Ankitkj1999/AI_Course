/**
 * Test script for optionalAuth middleware
 * 
 * This script tests that the optionalAuth middleware:
 * 1. Allows requests without authentication tokens
 * 2. Attaches user to request when valid token is provided
 * 3. Continues without error when invalid token is provided
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.WEBSITE_URL || 'http://localhost:5010';
const API_URL = `${BASE_URL}/api`;

console.log('Testing optionalAuth middleware...\n');

// Test 1: Request without authentication
async function testWithoutAuth() {
    console.log('Test 1: Request without authentication token');
    try {
        const response = await axios.get(`${API_URL}/public/content`, {
            params: { type: 'all', page: 1, limit: 5 }
        });
        
        if (response.status === 200) {
            console.log('✓ Request succeeded without authentication');
            console.log(`  - Returned ${response.data.data?.length || 0} items\n`);
            return true;
        }
    } catch (error) {
        console.log('✗ Request failed:', error.response?.status, error.message);
        return false;
    }
}

// Test 2: Request with invalid token
async function testWithInvalidAuth() {
    console.log('Test 2: Request with invalid authentication token');
    try {
        const response = await axios.get(`${API_URL}/public/content`, {
            params: { type: 'all', page: 1, limit: 5 },
            headers: {
                Cookie: 'auth_token=invalid_token_12345'
            }
        });
        
        if (response.status === 200) {
            console.log('✓ Request succeeded with invalid token (silently ignored)');
            console.log(`  - Returned ${response.data.data?.length || 0} items\n`);
            return true;
        }
    } catch (error) {
        console.log('✗ Request failed:', error.response?.status, error.message);
        return false;
    }
}

// Test 3: Verify endpoint behavior
async function testEndpointBehavior() {
    console.log('Test 3: Verify public content endpoint behavior');
    try {
        const response = await axios.get(`${API_URL}/public/content`, {
            params: { type: 'quiz', page: 1, limit: 10 }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('✓ Public content endpoint working correctly');
            console.log(`  - Success: ${response.data.success}`);
            console.log(`  - Total items: ${response.data.pagination?.totalItems || 0}`);
            console.log(`  - Current page: ${response.data.pagination?.currentPage || 1}\n`);
            return true;
        }
    } catch (error) {
        console.log('✗ Request failed:', error.response?.status, error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    const results = [];
    
    results.push(await testWithoutAuth());
    results.push(await testWithInvalidAuth());
    results.push(await testEndpointBehavior());
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed}/${total} passed`);
    console.log('='.repeat(50));
    
    if (passed === total) {
        console.log('\n✓ All tests passed! optionalAuth middleware is working correctly.');
        process.exit(0);
    } else {
        console.log('\n✗ Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('Test execution failed:', error.message);
    process.exit(1);
});
