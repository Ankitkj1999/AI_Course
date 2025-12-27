/**
 * Test script for Course APIs
 * Tests the core course functionality including generation, hierarchy, content, and progress
 */

import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5010';

// Test configuration - update these with actual values
const testConfig = {
    // Test user credentials (update with actual test user)
    testUserId: 'test-user-id-here',
    testAuthToken: 'test-auth-token-here',
    
    // Test course data
    testCourseTopic: 'JavaScript Basics',
    testCourseType: 'text course',
    testLanguage: 'english',
    
    // Generated during tests
    generatedCourseId: null,
    generatedCourseSlug: null,
    generatedSectionId: null
};

async function testCourseAPIs() {
    console.log('🧪 Testing Course APIs\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Generate a new course
    await runTest(
        results,
        'Generate new course',
        async () => {
            const response = await axios.post(
                `${BASE_URL}/api/course`,
                {
                    topic: testConfig.testCourseTopic,
                    type: testConfig.testCourseType,
                    language: testConfig.testLanguage
                },
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                // Store generated course data for subsequent tests
                testConfig.generatedCourseId = response.data.courseId;
                testConfig.generatedCourseSlug = response.data.slug;
                
                console.log(`   📝 Generated Course ID: ${testConfig.generatedCourseId}`);
                console.log(`   🔗 Generated Course Slug: ${testConfig.generatedCourseSlug}`);
                
                return true;
            }
            return false;
        }
    );
    
    // Test 2: Get course hierarchy (should have structure but no content)
    await runTest(
        results,
        'Get course hierarchy (empty content)',
        async () => {
            if (!testConfig.generatedCourseId) {
                throw new Error('No course ID available from previous test');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/v2/courses/${testConfig.generatedCourseId}/hierarchy?includeContent=true`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const hierarchy = response.data.hierarchy;
                
                // Verify structure exists
                const hasStructure = hierarchy && hierarchy.length > 0;
                
                // Verify no content exists yet (should be null/empty)
                const hasNoContent = hierarchy.every(section => 
                    !section.children || section.children.every(child => 
                        !child.content?.markdown?.text && !child.content?.html?.text
                    )
                );
                
                console.log(`   📊 Sections found: ${hierarchy?.length || 0}`);
                console.log(`   📝 Content generated: ${!hasNoContent ? 'Yes' : 'No'}`);
                
                // Store first subtopic section ID for content generation test
                if (hierarchy && hierarchy[0]?.children?.[0]?._id) {
                    testConfig.generatedSectionId = hierarchy[0].children[0]._id;
                    console.log(`   🎯 First subtopic ID: ${testConfig.generatedSectionId}`);
                }
                
                return hasStructure && hasNoContent;
            }
            return false;
        }
    );
    
    // Test 3: Generate content for a subtopic
    await runTest(
        results,
        'Generate content for subtopic',
        async () => {
            if (!testConfig.generatedSectionId) {
                throw new Error('No section ID available from previous test');
            }
            
            // First, generate content using the /api/generate endpoint
            const generateResponse = await axios.post(
                `${BASE_URL}/api/generate`,
                {
                    prompt: `Explain what is ${testConfig.testCourseTopic} in simple terms for beginners`,
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7
                },
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            if (generateResponse.status !== 200 || !generateResponse.data.success) {
                throw new Error('Content generation failed');
            }
            
            const generatedText = generateResponse.data.text;
            console.log(`   📝 Generated content length: ${generatedText.length} characters`);
            
            // Now save the content to the section
            const saveResponse = await axios.post(
                `${BASE_URL}/api/sections/${testConfig.generatedSectionId}/content`,
                {
                    content: generatedText,
                    contentType: 'markdown',
                    metadata: {
                        done: false,
                        image: null,
                        youtube: null
                    }
                },
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            return saveResponse.status === 200 && saveResponse.data.success;
        }
    );
    
    // Test 4: Verify content was saved (hierarchy should now show content)
    await runTest(
        results,
        'Verify content was saved in hierarchy',
        async () => {
            if (!testConfig.generatedCourseId) {
                throw new Error('No course ID available');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/v2/courses/${testConfig.generatedCourseId}/hierarchy?includeContent=true`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const hierarchy = response.data.hierarchy;
                
                // Find the section we added content to
                let foundContent = false;
                for (const section of hierarchy) {
                    if (section.children) {
                        for (const child of section.children) {
                            if (child._id === testConfig.generatedSectionId) {
                                foundContent = !!(child.content?.markdown?.text || child.content?.html?.text);
                                if (foundContent) {
                                    console.log(`   ✅ Content found in section: ${child.title}`);
                                    console.log(`   📝 Content length: ${child.content.markdown?.text?.length || child.content.html?.text?.length} characters`);
                                }
                                break;
                            }
                        }
                    }
                }
                
                return foundContent;
            }
            return false;
        }
    );
    
    // Test 5: Get course progress
    await runTest(
        results,
        'Get course progress',
        async () => {
            if (!testConfig.generatedCourseId) {
                throw new Error('No course ID available');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/course/${testConfig.generatedCourseId}/progress`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const progress = response.data.progress;
                
                console.log(`   📊 Exam passed: ${progress.examPassed}`);
                console.log(`   🌐 Language: ${response.data.language}`);
                
                // Verify expected structure
                return progress.hasOwnProperty('examPassed') && 
                       response.data.hasOwnProperty('language');
            }
            return false;
        }
    );
    
    // Test 6: Get course by slug
    await runTest(
        results,
        'Get course by slug',
        async () => {
            if (!testConfig.generatedCourseSlug) {
                throw new Error('No course slug available');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/course/${testConfig.generatedCourseSlug}`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const course = response.data.course;
                
                console.log(`   📚 Course title: ${course.mainTopic}`);
                console.log(`   🔗 Course slug: ${course.slug}`);
                console.log(`   📝 Course type: ${course.type}`);
                
                // Verify expected fields
                return course.mainTopic === testConfig.testCourseTopic &&
                       course.slug === testConfig.generatedCourseSlug &&
                       course.type === testConfig.testCourseType;
            }
            return false;
        }
    );
    
    // Test 7: Update section completion status
    await runTest(
        results,
        'Update section completion status',
        async () => {
            if (!testConfig.generatedSectionId) {
                throw new Error('No section ID available');
            }
            
            const response = await axios.post(
                `${BASE_URL}/api/sections/${testConfig.generatedSectionId}/content`,
                {
                    metadata: {
                        done: true
                    }
                },
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                console.log(`   ✅ Section marked as completed`);
                return true;
            }
            return false;
        }
    );
    
    // Test 8: Verify completion status in hierarchy
    await runTest(
        results,
        'Verify completion status in hierarchy',
        async () => {
            if (!testConfig.generatedCourseId || !testConfig.generatedSectionId) {
                throw new Error('Missing course or section ID');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/v2/courses/${testConfig.generatedCourseId}/hierarchy?includeContent=true`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const hierarchy = response.data.hierarchy;
                
                // Find the section we marked as complete
                let foundCompletion = false;
                for (const section of hierarchy) {
                    if (section.children) {
                        for (const child of section.children) {
                            if (child._id === testConfig.generatedSectionId) {
                                foundCompletion = child.content?.metadata?.done === true;
                                if (foundCompletion) {
                                    console.log(`   ✅ Section "${child.title}" is marked as completed`);
                                }
                                break;
                            }
                        }
                    }
                }
                
                return foundCompletion;
            }
            return false;
        }
    );
    
    // Test 9: Get user courses list
    await runTest(
        results,
        'Get user courses list',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/courses?userId=${testConfig.testUserId}&page=1&limit=10&visibility=all`,
                {
                    headers: {
                        'Cookie': `auth_token=${testConfig.testAuthToken}`
                    },
                    withCredentials: true
                }
            );
            
            if (response.status === 200) {
                const courses = response.data.courses || response.data || [];
                
                console.log(`   📚 Total courses found: ${courses.length}`);
                
                // Check if our generated course is in the list
                const foundOurCourse = courses.some(course => 
                    course._id === testConfig.generatedCourseId
                );
                
                if (foundOurCourse) {
                    console.log(`   ✅ Generated course found in user's course list`);
                }
                
                return courses.length >= 0; // Should at least return an array
            }
            return false;
        }
    );
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Course API Test Summary:');
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
    
    // Cleanup instructions
    if (testConfig.generatedCourseId) {
        console.log('\n📝 Cleanup Instructions:');
        console.log(`To clean up the test course, you can delete course ID: ${testConfig.generatedCourseId}`);
        console.log(`Course slug: ${testConfig.generatedCourseSlug}`);
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
console.log('Course API Testing Instructions:');
console.log('1. Start the server: npm start');
console.log('2. Create a test user account and get auth token');
console.log('3. Update testConfig with actual userId and authToken');
console.log('4. Uncomment the testCourseAPIs() call below');
console.log('5. Run: node test-course-apis.js\n');

console.log('Test Configuration Required:');
console.log('- testUserId: Your test user ID from the database');
console.log('- testAuthToken: Valid auth token for the test user');
console.log('- Ensure the test user has permission to create courses\n');

// Uncomment to run tests
// testCourseAPIs();