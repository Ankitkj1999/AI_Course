import mongoose from 'mongoose';
import { Section } from '../models/index.js';

/**
 * Script to fix invalid Lexical content in existing sections
 */
async function fixLexicalContent() {
    try {
        console.log('🔧 Starting Lexical content cleanup...');
        
        // Find all sections with potentially invalid Lexical content
        const sections = await Section.find({
            'content.lexical.editorState': { $exists: true }
        });
        
        console.log(`📊 Found ${sections.length} sections with Lexical content`);
        
        let fixedCount = 0;
        let errorCount = 0;
        
        for (const section of sections) {
            try {
                const lexicalState = section.content.lexical.editorState;
                
                // Check if the Lexical state is invalid
                if (lexicalState === undefined || 
                    (typeof lexicalState === 'object' && lexicalState !== null && !lexicalState.root)) {
                    
                    console.log(`🔧 Fixing section: ${section.title} (${section._id})`);
                    
                    // Set to null instead of undefined or invalid object
                    section.content.lexical.editorState = null;
                    
                    // If this was the primary format, switch to markdown
                    if (section.content.primaryFormat === 'lexical') {
                        section.content.primaryFormat = 'markdown';
                        
                        // Ensure there's some markdown content
                        if (!section.content.markdown?.text) {
                            section.content.markdown = {
                                text: '',
                                generatedAt: new Date()
                            };
                        }
                    }
                    
                    await section.save();
                    fixedCount++;
                }
            } catch (error) {
                console.error(`❌ Error fixing section ${section._id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`✅ Cleanup complete:`);
        console.log(`   - Fixed: ${fixedCount} sections`);
        console.log(`   - Errors: ${errorCount} sections`);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aicourse';
    
    mongoose.connect(mongoUri)
        .then(() => {
            console.log('📦 Connected to MongoDB');
            return fixLexicalContent();
        })
        .then(() => {
            console.log('🎉 Cleanup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Cleanup failed:', error);
            process.exit(1);
        });
}

export default fixLexicalContent;