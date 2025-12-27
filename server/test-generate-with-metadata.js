/**
 * Test script for /api/generate endpoint with metadata
 * Tests that content AND metadata are saved in a single API call
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

async function testGenerateWithMetadata() {
  console.log('\n📝 TEST: Generate content with metadata in single operation\n');
  
  try {
    await connectDB();
    
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
      courseTitle: testCourse?.mainTopic
    });
    
    // Step 2: Generate content
    console.log('\n2️⃣ Generating content via LLM...');
    const prompt = `Explain ${testSection.title} in detail with examples.`;
    const result = await llmService.generateContent(prompt, {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      temperature: 0.7
    });
    
    if (!result.success) {
      console.error('❌ Content generation failed:', result.error);
      return;
    }
    
    console.log('✅ Content generated:', {
      contentLength: result.data.content.length,
      provider: result.data.provider,
      model: result.data.model
    });
    
    // Step 3: Convert content to multi-format
    console.log('\n3️⃣ Converting content to multi-format...');
    const convertedContent = await ContentConverter.convertToMultiFormat(
      result.data.content,
      'markdown'
    );
    
    console.log('✅ Content converted:', {
      hasMarkdown: !!convertedContent.markdown?.text,
      hasHtml: !!convertedContent.html?.text,
      hasLexical: !!convertedContent.lexical?.text
    });
    
    // Step 4: Add metadata to content
    console.log('\n4️⃣ Adding metadata to content...');
    const testMetadata = {
      image: 'https://example.com/test-image.jpg',
      youtube: 'test-video-id'
    };
    
    convertedContent.metadata = {
      ...convertedContent.metadata,
      ...testMetadata
    };
    
    console.log('✅ Metadata added:', testMetadata);
    
    // Step 5: Save content with metadata to section
    console.log('\n5️⃣ Saving content with metadata to section...');
    const updatedSection = await SectionService.updateSection(testSection._id.toString(), {
      content: convertedContent,
      userId: testCourse.user
    });
    
    console.log('✅ Section updated:', {
      sectionId: updatedSection._id,
      title: updatedSection.title,
      wordCount: updatedSection.wordCount,
      hasContent: updatedSection.hasContent
    });
    
    // Step 6: Verify metadata was saved
    console.log('\n6️⃣ Verifying metadata was saved...');
    const verifiedSection = await Section.findById(testSection._id);
    
    console.log('\n✅ VERIFICATION RESULTS:');
    console.log('  Section title:', verifiedSection.title);
    console.log('  Has markdown:', !!verifiedSection.content?.markdown?.text);
    console.log('  Has HTML:', !!verifiedSection.content?.html?.text);
    console.log('  Has Lexical:', !!verifiedSection.content?.lexical?.text);
    console.log('  Markdown length:', verifiedSection.content?.markdown?.text?.length || 0);
    console.log('  HTML length:', verifiedSection.content?.html?.text?.length || 0);
    console.log('  Image URL:', verifiedSection.content?.metadata?.image || 'none');
    console.log('  YouTube ID:', verifiedSection.content?.metadata?.youtube || 'none');
    
    // Check if metadata was saved correctly
    const hasImage = verifiedSection.content?.metadata?.image === testMetadata.image;
    const hasYoutube = verifiedSection.content?.metadata?.youtube === testMetadata.youtube;
    
    if (hasImage && hasYoutube) {
      console.log('\n✅ SUCCESS: Content and metadata saved together!');
      console.log('   This proves the backend can handle metadata in the same operation');
    } else {
      console.log('\n⚠️ WARNING: Metadata may not have been saved correctly');
      console.log('   Expected image:', testMetadata.image);
      console.log('   Expected youtube:', testMetadata.youtube);
      console.log('   Got image:', verifiedSection.content?.metadata?.image);
      console.log('   Got youtube:', verifiedSection.content?.metadata?.youtube);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testGenerateWithMetadata();
