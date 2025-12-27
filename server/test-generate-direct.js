#!/usr/bin/env node

/**
 * Direct test of generate-with-save functionality
 * Tests the service layer directly without HTTP authentication
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services and models
import Section from './models/Section.js';
import Course from './models/Course.js';
import llmService from './services/llmService.js';
import SectionService from './services/sectionService.js';
import ContentConverter from './services/contentConverter.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aicourse';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function testGenerateAndSave() {
    console.log('\n🧪 Testing Generate-and-Save Functionality (Direct)...\n');
    
    try {
        // Step 1: Find a test section
        console.log('1️⃣ Finding test section...');
        const testSection = await Section.findOne().limit(1);
        
        if (!testSection) {
            console.log('❌ No sections found in database');
            return;
        }
        
        const testCourse = await Course.findById(testSection.courseId);
        
        console.log('✅ Found test section:', {
            sectionId: testSection._id,
            title: testSection.title,
            courseTitle: testCourse?.title || 'Unknown',
            currentWordCount: testSection.wordCount,
            hasContent: testSection.hasContent
        });
        
        // Step 2: Get current content for comparison
        console.log('\n2️⃣ Current section state:');
        const beforeContent = testSection.content.markdown?.text || '';
        console.log('Content length:', beforeContent.length);
        console.log('Word count:', testSection.wordCount);
        console.log('Has content:', testSection.hasContent);
        
        // Step 3: Generate content using LLM
        console.log('\n3️⃣ Generating content via LLM...');
        
        const testPrompt = `Write a comprehensive introduction to "${testSection.title}". Include:
- What it is and why it matters
- Key concepts to understand
- Real-world applications
- Common use cases

Make it educational and engaging (about 200-250 words).`;
        
        console.log('Prompt:', testPrompt.substring(0, 100) + '...');
        
        const result = await llmService.generateContent(testPrompt, {
            provider: 'gemini',
            model: 'gemini-2.0-flash-exp',
            temperature: 0.7
        });
        
        if (!result.success) {
            console.log('❌ Content generation failed:', result.error.message);
            return;
        }
        
        console.log('✅ Content generated:', {
            contentLength: result.data.content?.length || 0,
            provider: result.data.provider,
            model: result.data.model,
            responseTime: result.data.responseTime + 'ms'
        });
        
        console.log('\nGenerated content preview:');
        console.log(result.data.content.substring(0, 200) + '...\n');
        
        // Step 4: Convert to multi-format
        console.log('4️⃣ Converting to multi-format...');
        
        const convertedContent = await ContentConverter.convertToMultiFormat(
            result.data.content,
            'markdown'
        );
        
        console.log('✅ Content converted:', {
            hasMarkdown: !!convertedContent.markdown?.text,
            hasHtml: !!convertedContent.html?.text,
            hasLexical: !!convertedContent.lexical?.editorState,
            primaryFormat: convertedContent.primaryFormat,
            markdownLength: convertedContent.markdown?.text?.length || 0,
            htmlLength: convertedContent.html?.text?.length || 0,
            markdownWordCount: convertedContent.markdown?.wordCount || 0
        });
        
        // Step 5: Save to section
        console.log('\n5️⃣ Saving to section...');
        
        const updatedSection = await SectionService.updateSection(testSection._id, {
            content: convertedContent,
            userId: 'test-system'
        });
        
        console.log('✅ Section updated:', {
            sectionId: updatedSection._id,
            title: updatedSection.title,
            wordCount: updatedSection.wordCount,
            hasContent: updatedSection.hasContent,
            readTime: updatedSection.readTime
        });
        
        // Step 6: Verify persistence with fresh query
        console.log('\n6️⃣ Verifying database persistence...');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const verificationSection = await Section.findById(testSection._id);
        const persistedContent = verificationSection.content.markdown?.text || '';
        
        console.log('📄 Fresh database query:', {
            sectionId: verificationSection._id,
            hasContent: verificationSection.hasContent,
            wordCount: verificationSection.wordCount,
            contentLength: persistedContent.length,
            multiFormat: {
                markdown: !!verificationSection.content.markdown?.text,
                html: !!verificationSection.content.html?.text,
                lexical: !!verificationSection.content.lexical?.editorState
            }
        });
        
        // Step 7: Verify content matches
        console.log('\n7️⃣ Content verification:');
        console.log('Generated length:', result.data.content.length);
        console.log('Persisted length:', persistedContent.length);
        console.log('Content matches:', result.data.content === persistedContent);
        
        // Step 8: Verify multi-format integrity
        console.log('\n8️⃣ Multi-format integrity:');
        const htmlPreview = verificationSection.content.html?.text?.substring(0, 100) || '';
        console.log('HTML preview:', htmlPreview + '...');
        console.log('HTML contains expected tags:', htmlPreview.includes('<') && htmlPreview.includes('>'));
        
        // Final verdict
        console.log('\n9️⃣ Final verdict:');
        const allChecks = [
            { name: 'Content generated', pass: result.success },
            { name: 'Multi-format conversion', pass: convertedContent.markdown?.text && convertedContent.html?.text },
            { name: 'Section updated', pass: updatedSection.hasContent && updatedSection.wordCount > 0 },
            { name: 'Database persistence', pass: persistedContent.length > 0 },
            { name: 'Content matches', pass: result.data.content === persistedContent },
            { name: 'Markdown format', pass: !!verificationSection.content.markdown?.text },
            { name: 'HTML format', pass: !!verificationSection.content.html?.text },
            { name: 'Lexical format', pass: !!verificationSection.content.lexical?.editorState }
        ];
        
        console.log('\nChecklist:');
        allChecks.forEach(check => {
            console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
        });
        
        const allPassed = allChecks.every(check => check.pass);
        
        if (allPassed) {
            console.log('\n🎉 SUCCESS: All checks passed!');
            console.log('The generate-and-save functionality is working correctly.');
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS: Some checks failed');
            const failedChecks = allChecks.filter(check => !check.pass);
            console.log('Failed checks:', failedChecks.map(c => c.name).join(', '));
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function main() {
    await connectDB();
    await testGenerateAndSave();
    await mongoose.disconnect();
    console.log('\n🔚 Test complete');
}

// Run the test
main().catch(console.error);
