import { Section } from '../models/index.js';
import contentConverter from './contentConverter.js';

/**
 * Content Versioning Service
 * Handles version history tracking and content restoration
 */
class ContentVersioning {
    
    /**
     * Save current content as a version before updating
     */
    static async saveVersion(sectionId, userId, changeDescription = null) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        const currentContent = section.content[section.content.primaryFormat];
        if (!currentContent || !currentContent.text) {
            return null; // No content to version
        }
        
        const version = {
            format: section.content.primaryFormat,
            content: {
                text: currentContent.text,
                generatedAt: currentContent.generatedAt || currentContent.lastEditedAt
            },
            savedAt: new Date(),
            savedBy: userId,
            changeDescription: changeDescription,
            wordCount: contentConverter.calculateWordCount(
                currentContent.text, 
                section.content.primaryFormat
            )
        };
        
        // Add version to history
        section.versions.push(version);
        
        // Limit version history (keep last 50 versions)
        if (section.versions.length > 50) {
            section.versions = section.versions.slice(-50);
        }
        
        await section.save();
        return version;
    }
    
    /**
     * Restore content from a specific version
     */
    static async restoreVersion(sectionId, versionIndex, userId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        if (versionIndex < 0 || versionIndex >= section.versions.length) {
            throw new Error('Invalid version index');
        }
        
        const version = section.versions[versionIndex];
        
        // Save current content as a version before restoring
        await this.saveVersion(sectionId, userId, 'Before restore operation');
        
        // Restore the version content
        const restoredContent = {
            text: version.content.text,
            generatedAt: version.content.generatedAt,
            restoredAt: new Date(),
            restoredBy: userId,
            restoredFromVersion: versionIndex
        };
        
        // Update the primary format content
        section.content[version.format] = restoredContent;
        section.content.primaryFormat = version.format;
        
        // Convert to other formats
        await this.syncContentFormats(section, version.format);
        
        await section.save();
        return section;
    }
    
    /**
     * Get version history for a section
     */
    static async getVersionHistory(sectionId, options = {}) {
        const { limit = 20, offset = 0, includeContent = false } = options;
        
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        let versions = section.versions.slice().reverse(); // Most recent first
        
        // Apply pagination
        const total = versions.length;
        versions = versions.slice(offset, offset + limit);
        
        // Optionally exclude content for performance
        if (!includeContent) {
            versions = versions.map(version => ({
                format: version.format,
                savedAt: version.savedAt,
                savedBy: version.savedBy,
                changeDescription: version.changeDescription,
                wordCount: version.wordCount
            }));
        }
        
        return {
            versions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }
    
    /**
     * Compare two versions of content
     */
    static async compareVersions(sectionId, version1Index, version2Index) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        const version1 = section.versions[version1Index];
        const version2 = section.versions[version2Index];
        
        if (!version1 || !version2) {
            throw new Error('Invalid version indices');
        }
        
        // Basic comparison - in a real implementation, you'd use a diff library
        const comparison = {
            version1: {
                index: version1Index,
                savedAt: version1.savedAt,
                savedBy: version1.savedBy,
                wordCount: version1.wordCount,
                format: version1.format
            },
            version2: {
                index: version2Index,
                savedAt: version2.savedAt,
                savedBy: version2.savedBy,
                wordCount: version2.wordCount,
                format: version2.format
            },
            changes: {
                wordCountDiff: version2.wordCount - version1.wordCount,
                formatChanged: version1.format !== version2.format,
                timeDiff: version2.savedAt - version1.savedAt
            }
        };
        
        return comparison;
    }
    
    /**
     * Sync content across all formats when primary format changes
     */
    static async syncContentFormats(section, primaryFormat) {
        const primaryContent = section.content[primaryFormat];
        if (!primaryContent || !primaryContent.text) {
            return;
        }
        
        const now = new Date();
        
        try {
            // Convert to other formats
            if (primaryFormat === 'markdown') {
                // Convert markdown to HTML
                section.content.html = {
                    text: contentConverter.markdownToHtml(primaryContent.text),
                    generatedAt: now
                };
                
                // Convert markdown to Lexical (if needed)
                if (section.content.lexical) {
                    section.content.lexical = {
                        editorState: contentConverter.markdownToLexical(primaryContent.text),
                        lastEditedAt: now
                    };
                }
            } else if (primaryFormat === 'lexical') {
                // Convert Lexical to HTML
                section.content.html = {
                    text: contentConverter.lexicalToHtml(primaryContent.editorState),
                    generatedAt: now
                };
                
                // Convert Lexical to Markdown
                section.content.markdown = {
                    text: contentConverter.lexicalToMarkdown(primaryContent.editorState),
                    generatedAt: now
                };
            }
        } catch (error) {
            console.error('Error syncing content formats:', error);
            // Don't throw - partial sync is better than no sync
        }
    }
    
    /**
     * Clean up old versions to manage storage
     */
    static async cleanupVersions(sectionId, keepCount = 20) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        if (section.versions.length <= keepCount) {
            return { cleaned: 0, remaining: section.versions.length };
        }
        
        const toRemove = section.versions.length - keepCount;
        section.versions = section.versions.slice(-keepCount);
        
        await section.save();
        
        return { cleaned: toRemove, remaining: section.versions.length };
    }
    
    /**
     * Get content statistics across all versions
     */
    static async getContentStats(sectionId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        const stats = {
            totalVersions: section.versions.length,
            currentWordCount: section.wordCount,
            formats: {
                markdown: section.content.markdown ? 1 : 0,
                html: section.content.html ? 1 : 0,
                lexical: section.content.lexical ? 1 : 0
            },
            primaryFormat: section.content.primaryFormat,
            lastModified: section.updatedAt
        };
        
        if (section.versions.length > 0) {
            const wordCounts = section.versions.map(v => v.wordCount || 0);
            stats.versionStats = {
                minWordCount: Math.min(...wordCounts),
                maxWordCount: Math.max(...wordCounts),
                avgWordCount: Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length),
                firstVersion: section.versions[0].savedAt,
                lastVersion: section.versions[section.versions.length - 1].savedAt
            };
        }
        
        return stats;
    }
}

export default ContentVersioning;