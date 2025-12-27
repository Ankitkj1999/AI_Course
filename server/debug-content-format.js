/**
 * Debug Content Format
 * This script tests the content format parsing
 */

import CourseGenerationService from './services/courseGenerationService.js';

async function debugContentFormat() {
    console.log('🔍 Debugging Content Format Parsing\n');
    
    // Sample content that might be generated
    const sampleContent1 = `{
  "JavaScript Testing Fundamentals": [
    {
      "title": "1. Introduction to JavaScript Testing",
      "subtopics": [
        {
          "title": "Why Test JavaScript?",
          "theory": "Testing is essential for ensuring code quality..."
        }
      ]
    }
  ]
}`;

    const sampleContent2 = `\`\`\`json
{
  "JavaScript Testing Fundamentals": [
    {
      "title": "1. Introduction to JavaScript Testing",
      "subtopics": [
        {
          "title": "Why Test JavaScript?",
          "theory": "Testing is essential for ensuring code quality..."
        }
      ]
    }
  ]
}
\`\`\``;

    console.log('Testing content format 1 (pure JSON):');
    try {
        const parsed1 = CourseGenerationService.parseLegacyContent(sampleContent1);
        console.log('✅ Parsed successfully');
        console.log('   Title:', parsed1.title);
        console.log('   Sections:', parsed1.sections.length);
    } catch (error) {
        console.error('❌ Parse failed:', error.message);
    }
    
    console.log('\nTesting content format 2 (JSON in markdown):');
    try {
        const parsed2 = CourseGenerationService.parseLegacyContent(sampleContent2);
        console.log('✅ Parsed successfully');
        console.log('   Title:', parsed2.title);
        console.log('   Sections:', parsed2.sections.length);
    } catch (error) {
        console.error('❌ Parse failed:', error.message);
    }
}

debugContentFormat();