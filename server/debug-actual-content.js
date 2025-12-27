/**
 * Debug Actual Generated Content
 * This script generates content and tests parsing it
 */

import axios from 'axios';
import CourseGenerationService from './services/courseGenerationService.js';

const BASE_URL = 'http://localhost:5010';
const testAuth = {
    userId: '694f955319c63a0e8c68cfe9',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY5NTUzMTljNjNhMGU4YzY4Y2ZlOSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2NjgyMzI2OSwiZXhwIjoxNzY3NDI4MDY5fQ.64T8EYEbe6E0NE6EDRDQUBNrHWEb6CWDnf7RJ6kem7A'
};

async function debugActualContent() {
    console.log('🔍 Debugging Actual Generated Content\n');
    
    try {
        // Generate content
        console.log('Generating content...');
        const response = await axios.post(
            `${BASE_URL}/api/generate`,
            {
                prompt: 'Create a course outline for "JavaScript Testing Fundamentals". Return ONLY valid JSON in this exact format: {"JavaScript Testing Fundamentals": [{"title": "Introduction to Testing", "subtopics": [{"title": "What is Testing?", "theory": "Testing ensures code quality and reliability."}]}]}',
                provider: 'gemini',
                temperature: 0.3
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth_token=${testAuth.authToken}`
                },
                withCredentials: true,
                timeout: 60000
            }
        );
        
        const generatedContent = response.data.text;
        console.log('✅ Content generated successfully');
        console.log(`Length: ${generatedContent.length} characters\n`);
        
        console.log('Raw content:');
        console.log('---START---');
        console.log(generatedContent);
        console.log('---END---\n');
        
        // Test parsing
        console.log('Testing parsing...');
        try {
            const parsed = CourseGenerationService.parseLegacyContent(generatedContent);
            console.log('✅ Parsing successful');
            console.log('   Title:', parsed.title);
            console.log('   Sections:', parsed.sections.length);
            
            if (parsed.sections.length > 0) {
                console.log('   First section:', parsed.sections[0].title);
                console.log('   First section subtopics:', parsed.sections[0].subtopics?.length || 0);
            }
        } catch (error) {
            console.error('❌ Parsing failed:', error.message);
            console.error('Error details:', error);
        }
        
    } catch (error) {
        console.error('❌ Content generation failed:', error.message);
    }
}

debugActualContent();