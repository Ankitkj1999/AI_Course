/**
 * Debug LLM Response Structure
 * This script tests the exact response structure from LLM service
 */

import llmService from './services/llmService.js';

async function debugLLMResponse() {
    console.log('🔍 Debugging LLM Response Structure\n');
    
    try {
        console.log('Testing with Gemini provider...');
        const result = await llmService.generateContent(
            'Hello, this is a test prompt',
            {
                provider: 'gemini',
                temperature: 0.7
            }
        );
        
        console.log('LLM Service Result:');
        console.log('- Success:', result.success);
        console.log('- Type:', typeof result);
        console.log('- Keys:', Object.keys(result));
        
        if (result.success) {
            console.log('\nSuccess Data:');
            console.log('- Data type:', typeof result.data);
            console.log('- Data keys:', Object.keys(result.data));
            console.log('- Content type:', typeof result.data.content);
            console.log('- Content length:', result.data.content?.length);
            console.log('- Content preview:', result.data.content?.substring(0, 100));
        } else {
            console.log('\nError Data:');
            console.log('- Error:', result.error);
        }
        
        console.log('\nFull Result Object:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error during LLM service test:', error.message);
        console.error('Error details:', error);
    }
}

debugLLMResponse();