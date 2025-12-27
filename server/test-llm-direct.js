/**
 * Direct LLM Test - Test LLM providers directly to debug response format
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

async function testLLMDirect() {
    console.log('🧪 Testing LLM Providers Directly\n');
    
    // Test Google Gemini
    if (process.env.GOOGLE_API_KEY) {
        console.log('Testing Google Gemini...');
        try {
            const gemini = new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_API_KEY,
                model: 'gemini-2.0-flash',
                temperature: 0.7
            });
            
            console.log('Gemini instance created successfully');
            
            const response = await gemini.invoke('What is JavaScript? Answer in one sentence.');
            
            console.log('Gemini Response Type:', typeof response);
            console.log('Gemini Response Keys:', Object.keys(response));
            console.log('Gemini Response:', response);
            
            if (response.content) {
                console.log('✅ Gemini Content:', response.content);
            } else {
                console.log('❌ No content property found');
                console.log('Response structure:', JSON.stringify(response, null, 2));
            }
            
        } catch (error) {
            console.error('❌ Gemini Error:', error.message);
            console.error('Error details:', error);
        }
    } else {
        console.log('⚠️  Google API key not found');
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Test OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        console.log('Testing OpenRouter...');
        try {
            const { ChatOpenAI } = await import('@langchain/openai');
            
            const openrouter = new ChatOpenAI({
                apiKey: process.env.OPENROUTER_API_KEY,
                model: 'google/gemini-2.0-flash-exp:free',
                configuration: {
                    baseURL: 'https://openrouter.ai/api/v1'
                },
                temperature: 0.7
            });
            
            console.log('OpenRouter instance created successfully');
            
            const response = await openrouter.invoke('What is JavaScript? Answer in one sentence.');
            
            console.log('OpenRouter Response Type:', typeof response);
            console.log('OpenRouter Response Keys:', Object.keys(response));
            console.log('OpenRouter Response:', response);
            
            if (response.content) {
                console.log('✅ OpenRouter Content:', response.content);
            } else {
                console.log('❌ No content property found');
                console.log('Response structure:', JSON.stringify(response, null, 2));
            }
            
        } catch (error) {
            console.error('❌ OpenRouter Error:', error.message);
            console.error('Error details:', error);
        }
    } else {
        console.log('⚠️  OpenRouter API key not found');
    }
}

testLLMDirect();