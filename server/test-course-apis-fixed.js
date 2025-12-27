/**
 * Fixed Course API Tests
 * Tests the complete course workflow with proper content format
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5010';

// Real test credentials
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A',
    email: 'test@example.com'
};

// Test data
const testData = {
    courseId: null,
    courseSlug: null,
    sectionId: null
};

async function testCourseAPIsFixed() {
    console.log('🧪 Testing Course APIs (Fixed Version)\n');
    console.log(`👤 Test User: ${testAuth.email}`);
    console.log(`🆔 User ID: ${testAuth.userId}\n`);
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Authentication verification
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
    
    // Test 2: Content generation
    await runTest(
        results,
        'Content generation',
        async () => {
            const response = await axios.post(
                `${BASE_URL}/api/generate`,
                {
                    prompt: 'Explain JavaScript basics in simple terms',
                    provider: 'gemini',
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
            
            if (response.status === 200 && response.data.text) {
                console.log(`   📝 Generated content length: ${response.data.text.length} characters`);
                return true;
            }
            return false;
        }
    );
    
    // Test 3: Course creation with proper JSON format
    await runTest(
        results,
        'Course creation with structured content',
        async () => {
            // Create properly structured course content (no markdown wrapper)
            const courseContent = {
                "JavaScript Fundamentals": [
                    {
                        "title": "Introduction to JavaScript",
                        "subtopics": [
                            {
                                "title": "What is JavaScript?",
                                "theory": "JavaScript is a programming language that enables interactive web pages and is an essential part of web applications."
                            },
                            {
                                "title": "JavaScript Syntax",
                                "theory": "JavaScript syntax is the set of rules that defines a correctly structured JavaScript program."
                            }
                        ]
                    },
                    {
                        "title": "Variables and Data Types",
                        "subtopics": [
                            {
                                "title": "Declaring Variables",
                                "theory": "Variables in JavaScript can be declared using var, let, or const keywords."
                            },
                            {
                                "title": "Data Types",
                                "theory": "JavaScript has several data types including strings, numbers, booleans, objects, and arrays."
                            }
                        ]
                    }
                ]
            };
            
            const response = await axios.post(
                `${BASE_URL}/api/course`,
                {
                    user: testAuth.userId,
                    mainTopic: 'JavaScript Fundamentals',
                    type: 'Text & Image Course',
                    content: JSON.stringify(courseContent), // Send as JSON string
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
            
            if (response.status === 200 && response.data.success) {
                testData.courseId = response.data.courseId;
                testData.courseSlug = response.data.slug;
                
                console.log(`   📚 Created course ID: ${testData.courseId}`);
                console.log(`   🔗 Course slug: ${testData.courseSlug}`);
                console.log(`   📁 Sections created: ${response.data.sectionsCreated}`);
                console.log(`   🏗️ Architecture: ${response.data.architecture}`);
                
                return !!(testData.courseId && testData.courseSlug);
            }
            return false;
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
            }
            return false;
        }
    );
    
    // Test 5: Section content update
    await runTest(
        results,
        'Section content update',
        async () => {
            if (!testData.sectionId) {
                throw new Error('No section ID available from previous test');
            }
            
            const response = await axios.post(
                `${BASE_URL}/api/sections/${testData.sectionId}/content`,
                {
                    content: 'This is updated content for the JavaScript section. It explains the basics of JavaScript programming.',
                    contentType: 'markdown',
                    metadata: {
                        done: true,
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
            
            if (response.status === 200 && response.data.success) {
                console.log(`   ✅ Content updated successfully`);
                return true;
            }
            return false;
        }
    );
    
    // Test 6: Course progress tracking
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
                
                return progress.hasOwnProperty('examPassed');
            }
            return false;
        }
    );
    
    // Test 7: Course retrieval by slug
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
                
                return course.mainTopic === 'JavaScript Fundamentals';
            }
            return false;
        }
    );
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('Course API Test Summary (Fixed Version):');
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
        console.log('\n🎉 All course API tests passed!');
        console.log('✅ Backend is working correctly with the new section-based architecture');
    }
    
    if (testData.courseId) {
        console.log(`\n📝 Test Course Created:`);
        console.log(`   🆔 Course ID: ${testData.courseId}`);
        console.log(`   🔗 Course Slug: ${testData.courseSlug}`);
        console.log(`   👤 Owner: ${testAuth.email}`);
        console.log('\n💡 Course created successfully with section-based architecture');
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
testCourseAPIsFixed();