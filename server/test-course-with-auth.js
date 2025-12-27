/**
 * Course API Tests with Real Authentication
 * Tests the complete course workflow with actual user credentials
 */

import axios from 'axios';

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5010';

// Real test credentials (extracted from login)
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A',
    email: 'test@example.com'
};

// Test data that will be populated during tests
const testData = {
    courseId: null,
    courseSlug: null,
    sectionId: null
};

async function testCourseWithAuth() {
    console.log('🧪 Testing Course APIs with Real Authentication\n');
    console.log(`👤 Test User: ${testAuth.email}`);
    console.log(`🆔 User ID: ${testAuth.userId}\n`);
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Verify authentication works
    await runTest(
        results,
        'Authentication verification',
        async () => {
            const response = await axios.get(
                `${BASE_URL}/api/courses?userId=${testAuth.userId}&page=1&limit=5`,
                {
                    headers: {
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 10000
                }
            );
            
            console.log(`   ✅ Authentication successful`);
            console.log(`   📚 Existing courses: ${response.data.courses?.length || 0}`);
            
            return response.status === 200;
        }
    );
    
    // Test 2: Content generation with real auth
    await runTest(
        results,
        'Content generation with authentication',
        async () => {
            const response = await axios.post(
                `${BASE_URL}/api/generate`,
                {
                    prompt: 'Explain what JavaScript is in simple terms for beginners',
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
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
            
            if (response.status === 200 && response.data.success) {
                const generatedText = response.data.text;
                console.log(`   📝 Generated content length: ${generatedText.length} characters`);
                console.log(`   🎯 Content preview: ${generatedText.substring(0, 100)}...`);
                
                return generatedText && generatedText.length > 50;
            } else {
                throw new Error(`Content generation failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 3: Create a new course
    await runTest(
        results,
        'Course creation with authentication',
        async () => {
            const response = await axios.post(
                `${BASE_URL}/api/course`,
                {
                    topic: 'JavaScript Testing Fundamentals',
                    type: 'text course',
                    language: 'english'
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
            
            if (response.status === 200 && response.data.success) {
                testData.courseId = response.data.courseId;
                testData.courseSlug = response.data.slug;
                
                console.log(`   📚 Created course ID: ${testData.courseId}`);
                console.log(`   🔗 Course slug: ${testData.courseSlug}`);
                
                return !!(testData.courseId && testData.courseSlug);
            } else {
                throw new Error(`Course creation failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 4: Get course hierarchy
    await runTest(
        results,
        'Course hierarchy retrieval',
        async () => {
            if (!testData.courseId) {
                throw new Error('No course ID available from previous test');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/v2/courses/${testData.courseId}/hierarchy?includeContent=true`,
                {
                    headers: {
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 15000
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const hierarchy = response.data.hierarchy;
                const course = response.data.course;
                
                console.log(`   📊 Course: ${course?.title || 'Unknown'}`);
                console.log(`   📁 Root sections: ${hierarchy?.length || 0}`);
                
                if (hierarchy && hierarchy.length > 0) {
                    const totalSubtopics = hierarchy.reduce((total, section) => 
                        total + (section.children?.length || 0), 0
                    );
                    console.log(`   📝 Total subtopics: ${totalSubtopics}`);
                    
                    // Store first subtopic ID for content testing
                    if (hierarchy[0]?.children?.[0]?._id) {
                        testData.sectionId = hierarchy[0].children[0]._id;
                        console.log(`   🎯 First subtopic ID: ${testData.sectionId}`);
                    }
                }
                
                return hierarchy && Array.isArray(hierarchy) && hierarchy.length > 0;
            } else {
                throw new Error(`Hierarchy retrieval failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 5: Generate and save content to a section
    await runTest(
        results,
        'Section content generation and storage',
        async () => {
            if (!testData.sectionId) {
                throw new Error('No section ID available from previous test');
            }
            
            // First generate content
            const generateResponse = await axios.post(
                `${BASE_URL}/api/generate`,
                {
                    prompt: 'Explain JavaScript variables and how to declare them',
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
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
            
            if (generateResponse.status !== 200 || !generateResponse.data.success) {
                throw new Error('Content generation failed');
            }
            
            const generatedText = generateResponse.data.text;
            console.log(`   📝 Generated content length: ${generatedText.length} characters`);
            
            // Now save the content to the section
            const saveResponse = await axios.post(
                `${BASE_URL}/api/sections/${testData.sectionId}/content`,
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
                        'Content-Type': 'application/json',
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 15000
                }
            );
            
            if (saveResponse.status === 200 && saveResponse.data.success) {
                console.log(`   ✅ Content saved to section successfully`);
                return true;
            } else {
                throw new Error(`Content save failed: ${saveResponse.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 6: Verify content was saved by checking hierarchy again
    await runTest(
        results,
        'Verify content persistence in hierarchy',
        async () => {
            if (!testData.courseId || !testData.sectionId) {
                throw new Error('Missing course or section ID');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/v2/courses/${testData.courseId}/hierarchy?includeContent=true`,
                {
                    headers: {
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 15000
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const hierarchy = response.data.hierarchy;
                
                // Find the section we added content to
                let foundContent = false;
                let contentLength = 0;
                
                for (const section of hierarchy) {
                    if (section.children) {
                        for (const child of section.children) {
                            if (child._id === testData.sectionId) {
                                const hasContent = !!(child.content?.markdown?.text || child.content?.html?.text);
                                if (hasContent) {
                                    foundContent = true;
                                    contentLength = child.content.markdown?.text?.length || child.content.html?.text?.length || 0;
                                    console.log(`   ✅ Content found in section: ${child.title}`);
                                    console.log(`   📝 Content length: ${contentLength} characters`);
                                }
                                break;
                            }
                        }
                    }
                }
                
                return foundContent && contentLength > 0;
            } else {
                throw new Error(`Hierarchy retrieval failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 7: Get course progress
    await runTest(
        results,
        'Course progress tracking',
        async () => {
            if (!testData.courseId) {
                throw new Error('No course ID available');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/course/${testData.courseId}/progress`,
                {
                    headers: {
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 15000
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const progress = response.data.progress;
                
                console.log(`   📊 Exam passed: ${progress.examPassed}`);
                console.log(`   🌐 Language: ${response.data.language}`);
                
                return progress.hasOwnProperty('examPassed') && 
                       response.data.hasOwnProperty('language');
            } else {
                throw new Error(`Progress retrieval failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 8: Update section completion status
    await runTest(
        results,
        'Section completion status update',
        async () => {
            if (!testData.sectionId) {
                throw new Error('No section ID available');
            }
            
            const response = await axios.post(
                `${BASE_URL}/api/sections/${testData.sectionId}/content`,
                {
                    metadata: {
                        done: true
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 15000
                }
            );
            
            if (response.status === 200 && response.data.success) {
                console.log(`   ✅ Section marked as completed`);
                return true;
            } else {
                throw new Error(`Completion update failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Test 9: Get course by slug
    await runTest(
        results,
        'Course retrieval by slug',
        async () => {
            if (!testData.courseSlug) {
                throw new Error('No course slug available');
            }
            
            const response = await axios.get(
                `${BASE_URL}/api/course/${testData.courseSlug}`,
                {
                    headers: {
                        'Cookie': `auth_token=${testAuth.authToken}`
                    },
                    withCredentials: true,
                    timeout: 15000
                }
            );
            
            if (response.status === 200 && response.data.success) {
                const course = response.data.course;
                
                console.log(`   📚 Course: ${course.mainTopic}`);
                console.log(`   🔗 Slug: ${course.slug}`);
                console.log(`   📝 Type: ${course.type}`);
                
                return course.mainTopic === 'JavaScript Testing Fundamentals' &&
                       course.slug === testData.courseSlug;
            } else {
                throw new Error(`Course retrieval failed: ${response.data.message || 'Unknown error'}`);
            }
        }
    );
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('Authenticated Course API Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.tests.length}`);
    console.log('='.repeat(70));
    
    if (results.failed > 0) {
        console.log('\nFailed tests:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  ❌ ${t.name}: ${t.error}`));
    } else {
        console.log('\n🎉 All authenticated course API tests passed!');
        console.log('✅ Backend is working correctly with full authentication');
    }
    
    if (testData.courseId) {
        console.log(`\n📝 Test Course Created:`);
        console.log(`   🆔 Course ID: ${testData.courseId}`);
        console.log(`   🔗 Course Slug: ${testData.courseSlug}`);
        console.log(`   👤 Owner: ${testAuth.email}`);
        console.log('\n💡 You can view this course in the UI or clean it up manually if needed');
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

// Run the tests
testCourseWithAuth();