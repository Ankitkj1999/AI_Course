import { Section } from '../models/index.js';
import contentConverter from './contentConverter.js';
import ContentVersioning from './contentVersioning.js';

/**
 * Content Management Service
 * High-level service for managing multi-format content with versioning
 */
class ContentManager {
    
    /**
     * Update section content with automatic format conversion and versioning
     */
    static async updateSectionContent(sectionId, contentData, userId) {
        const { content, format, saveVersion = true, changeDescription } = contentData;
        
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        // Save current version if requested
        if (saveVersion && section.content[section.content.primaryFormat]?.text) {
            await ContentVersioning.saveVersion(sectionId, userId, changeDescription);
        }
        
        // Update the primary format content
        const now = new Date();
        if (format === 'markdown') {
            section.content.markdown = {
                text: content,
                generatedAt: now
            };
        } else if (format === 'lexical') {
            section.content.lexical = {
                editorState: content,
                lastEditedAt: now
            };
        }
        
        // Set as primary format
        section.content.primaryFormat = format;
        
        // Convert to other formats
        await this.syncAllFormats(section);
        
        // Update statistics
        section.wordCount = contentConverter.calculateWordCount(content, format);
        section.readTime = contentConverter.calculateReadTime(section.wordCount);
        
        await section.save();
        return section;
    }
    
    /**
     * Switch primary format for a section
     */
    static async switchPrimaryFormat(sectionId, newFormat, userId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        const validFormats = ['markdown', 'lexical'];
        if (!validFormats.includes(newFormat)) {
            throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
        }
        
        if (section.content.primaryFormat === newFormat) {
            return section; // Already the primary format
        }
        
        // Check if target format exists
        if (!section.content[newFormat] || !section.content[newFormat].text) {
            throw new Error(`Content not available in ${newFormat} format`);
        }
        
        // Save current version
        await ContentVersioning.saveVersion(
            sectionId, 
            userId, 
            `Switched primary format from ${section.content.primaryFormat} to ${newFormat}`
        );
        
        // Switch primary format
        section.content.primaryFormat = newFormat;
        
        // Recalculate statistics based on new primary format
        const primaryContent = newFormat === 'lexical' 
            ? section.content.lexical.editorState 
            : section.content.markdown.text;
            
        section.wordCount = contentConverter.calculateWordCount(primaryContent, newFormat);
        section.readTime = contentConverter.calculateReadTime(section.wordCount);
        
        await section.save();
        return section;
    }
    
    /**
     * Get section content in specified format
     */
    static async getSectionContent(sectionId, format = null, options = {}) {
        const { includeVersions = false, includeStats = false } = options;
        
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        // Use primary format if none specified
        const targetFormat = format || section.content.primaryFormat;
        
        // Get content in requested format
        let content = null;
        if (targetFormat === 'markdown' && section.content.markdown) {
            content = section.content.markdown.text;
        } else if (targetFormat === 'lexical' && section.content.lexical) {
            content = section.content.lexical.editorState;
        } else if (targetFormat === 'html' && section.content.html) {
            content = section.content.html.text;
        }
        
        // If content doesn't exist in requested format, try to convert
        if (!content && section.content[section.content.primaryFormat]) {
            try {
                const primaryContent = section.content.primaryFormat === 'lexical'
                    ? section.content.lexical.editorState
                    : section.content.markdown.text;
                    
                content = contentConverter.convertContent(
                    primaryContent,
                    section.content.primaryFormat,
                    targetFormat
                );
            } catch (error) {
                console.error('Error converting content format:', error);
            }
        }
        
        const result = {
            sectionId,
            title: section.title,
            content,
            format: targetFormat,
            primaryFormat: section.content.primaryFormat,
            wordCount: section.wordCount,
            readTime: section.readTime,
            lastModified: section.updatedAt
        };
        
        // Include version history if requested
        if (includeVersions) {
            result.versions = await ContentVersioning.getVersionHistory(sectionId);
        }
        
        // Include content statistics if requested
        if (includeStats) {
            result.stats = await ContentVersioning.getContentStats(sectionId);
        }
        
        return result;
    }
    
    /**
     * Bulk update multiple sections
     */
    static async bulkUpdateContent(updates, userId) {
        const results = [];
        const errors = [];
        
        for (const update of updates) {
            try {
                const { sectionId, content, format, changeDescription } = update;
                const result = await this.updateSectionContent(
                    sectionId,
                    { content, format, changeDescription },
                    userId
                );
                results.push({ sectionId, success: true, section: result });
            } catch (error) {
                errors.push({ 
                    sectionId: update.sectionId, 
                    success: false, 
                    error: error.message 
                });
            }
        }
        
        return { results, errors };
    }
    
    /**
     * Sync content across all formats
     */
    static async syncAllFormats(section) {
        const primaryFormat = section.content.primaryFormat;
        const primaryContent = primaryFormat === 'lexical' 
            ? section.content.lexical?.editorState
            : section.content.markdown?.text;
            
        if (!primaryContent) {
            return;
        }
        
        const now = new Date();
        
        try {
            if (primaryFormat === 'markdown') {
                // Convert markdown to HTML
                section.content.html = {
                    text: contentConverter.markdownToHtml(primaryContent),
                    generatedAt: now
                };
                
                // Convert markdown to Lexical if it exists
                if (section.content.lexical) {
                    section.content.lexical = {
                        editorState: contentConverter.markdownToLexical(primaryContent),
                        lastEditedAt: now
                    };
                }
            } else if (primaryFormat === 'lexical') {
                // Convert Lexical to HTML
                section.content.html = {
                    text: contentConverter.lexicalToHtml(primaryContent),
                    generatedAt: now
                };
                
                // Convert Lexical to Markdown
                section.content.markdown = {
                    text: contentConverter.lexicalToMarkdown(primaryContent),
                    generatedAt: now
                };
            }
        } catch (error) {
            console.error('Error syncing content formats:', error);
        }
    }
    
    /**
     * Import content from external source
     */
    static async importContent(sectionId, sourceContent, sourceFormat, userId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        // Save current version before import
        if (section.content[section.content.primaryFormat]?.text) {
            await ContentVersioning.saveVersion(
                sectionId, 
                userId, 
                `Imported content from ${sourceFormat}`
            );
        }
        
        // Convert source content to target format
        let targetContent;
        const targetFormat = section.content.primaryFormat || 'markdown';
        
        if (sourceFormat === targetFormat) {
            targetContent = sourceContent;
        } else {
            targetContent = contentConverter.convertContent(
                sourceContent,
                sourceFormat,
                targetFormat
            );
        }
        
        // Update content
        return await this.updateSectionContent(
            sectionId,
            {
                content: targetContent,
                format: targetFormat,
                saveVersion: false, // Already saved above
                changeDescription: `Imported from ${sourceFormat}`
            },
            userId
        );
    }
    
    /**
     * Export section content in specified format
     */
    static async exportContent(sectionId, format, options = {}) {
        const { includeMetadata = false } = options;
        
        const contentData = await this.getSectionContent(sectionId, format);
        
        if (includeMetadata) {
            return {
                content: contentData.content,
                metadata: {
                    title: contentData.title,
                    format: contentData.format,
                    wordCount: contentData.wordCount,
                    readTime: contentData.readTime,
                    lastModified: contentData.lastModified,
                    exportedAt: new Date()
                }
            };
        }
        
        return contentData.content;
    }
    
    /**
     * Search content across sections
     */
    static async searchContent(courseId, query, options = {}) {
        const { format = null, limit = 20, includeContent = false } = options;
        
        const searchQuery = {
            courseId,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { 'content.markdown.text': { $regex: query, $options: 'i' } },
                { 'content.html.text': { $regex: query, $options: 'i' } }
            ]
        };
        
        const sections = await Section.find(searchQuery)
            .limit(limit)
            .sort({ updatedAt: -1 });
        
        const results = [];
        
        for (const section of sections) {
            const result = {
                sectionId: section._id,
                title: section.title,
                path: section.path,
                wordCount: section.wordCount,
                lastModified: section.updatedAt
            };
            
            if (includeContent) {
                const contentData = await this.getSectionContent(
                    section._id, 
                    format || section.content.primaryFormat
                );
                result.content = contentData.content;
                result.format = contentData.format;
            }
            
            results.push(result);
        }
        
        return results;
    }
}

export default ContentManager;