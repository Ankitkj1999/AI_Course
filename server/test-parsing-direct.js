/**
 * Test Parsing Directly
 * Test the CourseGenerationService parsing without going through the server
 */

import CourseGenerationService from './services/courseGenerationService.js';

async function testParsingDirect() {
    console.log('🧪 Testing Parsing Directly\n');
    
    const testCases = [
        {
            name: 'Plain JSON',
            content: '{"Test": [{"title": "Section", "subtopics": []}]}'
        },
        {
            name: 'Markdown wrapped JSON',
            content: '```json\n{"Test Course": [{"title": "Section 1", "subtopics": [{"title": "Topic 1", "theory": "Content here"}]}]}\n```'
        },
        {
            name: 'Markdown wrapped without json tag',
            content: '```\n{"Test Course": [{"title": "Section 1", "subtopics": [{"title": "Topic 1", "theory": "Content here"}]}]}\n```'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);
        console.log(`Content: ${testCase.content}`);
        
        try {
            const result = CourseGenerationService.parseLegacyContent(testCase.content);
            console.log('✅ Success');
            console.log(`   Title: ${result.title}`);
            console.log(`   Sections: ${result.sections.length}`);
        } catch (error) {
            console.error('❌ Failed:', error.message);
        }
        console.log('');
    }
}

testParsingDirect();