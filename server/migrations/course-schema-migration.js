import mongoose from 'mongoose';
import { Course, Section } from '../models/index.js';
import { generateSlug } from '../utils/slugify.js';
import contentConverter from '../services/contentConverter.js';

/**
 * Enhanced Migration script for Course Schema Redesign
 * Converts existing courses to the new section-based structure with intelligent content analysis
 */

/**
 * Main migration function with progress tracking and error recovery
 */
export async function migrateCourseSchema(options = {}) {
    const { 
        batchSize = 10, 
        dryRun = false, 
        courseIds = null,
        progressCallback = null 
    } = options;
    
    console.log('Starting Enhanced Course Schema Migration...');
    if (dryRun) console.log('DRY RUN MODE - No changes will be saved');
    
    const session = await mongoose.startSession();
    
    try {
        // Get courses to migrate
        let query = { 'stats.totalSections': { $exists: false } };
        if (courseIds) {
            query._id = { $in: courseIds.map(id => new mongoose.Types.ObjectId(id)) };
        }
        
        const totalCourses = await Course.countDocuments(query);
        console.log(`Found ${totalCourses} courses to migrate`);
        
        let processed = 0;
        let migrated = 0;
        let errors = [];
        
        // Process in batches
        for (let skip = 0; skip < totalCourses; skip += batchSize) {
            if (!dryRun) {
                session.startTransaction();
            }
            
            try {
                const batch = await Course.find(query)
                    .skip(skip)
                    .limit(batchSize)
                    .session(dryRun ? null : session);
                
                for (const course of batch) {
                    try {
                        const result = await migrateSingleCourse(course, session, dryRun);
                        if (result.migrated) migrated++;
                        processed++;
                        
                        if (progressCallback) {
                            progressCallback({
                                processed,
                                total: totalCourses,
                                migrated,
                                current: course.title
                            });
                        }
                        
                        console.log(`[${processed}/${totalCourses}] ${result.migrated ? 'Migrated' : 'Skipped'}: ${course.title}`);
                        
                    } catch (error) {
                        errors.push({
                            courseId: course._id,
                            title: course.title,
                            error: error.message
                        });
                        console.error(`Error migrating course ${course._id}: ${error.message}`);
                    }
                }
                
                if (!dryRun) {
                    await session.commitTransaction();
                }
                
            } catch (batchError) {
                if (!dryRun) {
                    await session.abortTransaction();
                }
                console.error(`Batch error at skip ${skip}:`, batchError.message);
                errors.push({
                    batch: `${skip}-${skip + batchSize}`,
                    error: batchError.message
                });
            }
        }
        
        const summary = {
            success: true,
            processed,
            migrated,
            errors: errors.length,
            errorDetails: errors
        };
        
        console.log('\nMigration Summary:');
        console.log(`- Total processed: ${processed}`);
        console.log(`- Successfully migrated: ${migrated}`);
        console.log(`- Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\nErrors:');
            errors.forEach(error => {
                console.log(`- ${error.courseId || error.batch}: ${error.error}`);
            });
        }
        
        return summary;
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Migrate a single course to the new schema with enhanced content analysis
 */
async function migrateSingleCourse(course, session, dryRun = false) {
    // Skip if already migrated
    if (course.stats && course.stats.totalSections !== undefined) {
        return { migrated: false, reason: 'Already migrated' };
    }
    
    // Prepare enhanced course updates
    const updates = {
        // Enhanced type system
        type: mapLegacyType(course.type) || 'guide',
        
        // Generation metadata
        generationMeta: {
            userPrompt: course.userPrompt || null,
            model: course.model || null,
            generatedAt: course.date || course.createdAt || new Date(),
            lastModified: course.updatedAt || new Date()
        },
        
        // Enhanced status mapping
        status: mapLegacyStatus(course),
        
        // Course settings with intelligent defaults
        settings: {
            maxNestingDepth: determineOptimalNestingDepth(course.content),
            allowComments: true,
            showTableOfContents: shouldShowTOC(course.content),
            structure: determineStructureType(course.content)
        },
        
        // Initialize sections array
        sections: [],
        
        // Initialize stats
        stats: {
            totalSections: 0,
            totalWords: 0,
            estimatedReadTime: 0
        }
    };
    
    // Analyze and migrate content
    if (course.content && course.content.trim().length > 0) {
        const migrationResult = await migrateContentToSections(course, session, dryRun);
        updates.sections = migrationResult.sectionIds;
        updates.stats = migrationResult.stats;
    }
    
    // Update the course
    if (!dryRun) {
        await Course.findByIdAndUpdate(
            course._id,
            { $set: updates },
            { session }
        );
    }
    
    return { 
        migrated: true, 
        sectionsCreated: updates.sections.length,
        stats: updates.stats
    };
}

/**
 * Create a root section from existing course content
 */
async function createRootSectionFromContent(course, session) {
    // Analyze content to determine if it should be split
    const content = course.content;
    const sections = analyzeAndSplitContent(content);
    
    if (sections.length === 1) {
        // Single section - create one root section
        return await createSingleSection(course, sections[0], session);
    } else {
        // Multiple sections - create hierarchical structure
        return await createHierarchicalSections(course, sections, session);
    }
}

/**
 * Analyze content and split into logical sections
 */
function analyzeAndSplitContent(content) {
    // Simple content analysis - split by headers
    const lines = content.split('\n');
    const sections = [];
    let currentSection = { title: 'Introduction', content: '', level: 0 };
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for markdown headers
        if (trimmedLine.startsWith('#')) {
            // Save previous section if it has content
            if (currentSection.content.trim().length > 0) {
                sections.push(currentSection);
            }
            
            // Start new section
            const headerLevel = (trimmedLine.match(/^#+/) || [''])[0].length;
            const title = trimmedLine.replace(/^#+\s*/, '').trim() || 'Untitled Section';
            
            currentSection = {
                title,
                content: '',
                level: Math.min(headerLevel - 1, 2) // Cap at level 2 for initial migration
            };
        } else {
            currentSection.content += line + '\n';
        }
    }
    
    // Add the last section
    if (currentSection.content.trim().length > 0) {
        sections.push(currentSection);
    }
    
    // If no sections were found, create a single section with all content
    if (sections.length === 0) {
        sections.push({
            title: 'Content',
            content: content,
            level: 0
        });
    }
    
    return sections;
}

/**
 * Create a single section from content
 */
async function createSingleSection(course, sectionData, session) {
    const section = new Section({
        courseId: course._id,
        parentId: null,
        level: 0,
        path: '0',
        order: 0,
        title: sectionData.title,
        slug: generateSlug(sectionData.title),
        content: {
            markdown: {
                text: sectionData.content,
                generatedAt: course.date || new Date()
            },
            html: {
                text: convertMarkdownToHTML(sectionData.content),
                generatedAt: course.date || new Date()
            },
            primaryFormat: 'markdown'
        },
        hasContent: true,
        hasChildren: false,
        generationMeta: {
            prompt: null,
            model: null,
            generatedAt: course.date || new Date()
        }
    });
    
    await section.save({ session });
    return section;
}

/**
 * Create hierarchical sections from analyzed content
 */
async function createHierarchicalSections(course, sectionsData, session) {
    const createdSections = [];
    const sectionMap = new Map(); // level -> parent section
    
    for (let i = 0; i < sectionsData.length; i++) {
        const sectionData = sectionsData[i];
        const parentSection = sectionMap.get(sectionData.level - 1);
        
        const section = new Section({
            courseId: course._id,
            parentId: parentSection ? parentSection._id : null,
            level: sectionData.level,
            order: i,
            title: sectionData.title,
            slug: generateSlug(sectionData.title),
            content: {
                markdown: {
                    text: sectionData.content,
                    generatedAt: course.date || new Date()
                },
                html: {
                    text: convertMarkdownToHTML(sectionData.content),
                    generatedAt: course.date || new Date()
                },
                primaryFormat: 'markdown'
            },
            hasContent: true,
            hasChildren: false
        });
        
        // Generate path
        if (parentSection) {
            const siblingCount = createdSections.filter(s => 
                s.parentId && s.parentId.equals(parentSection._id)
            ).length;
            section.path = `${parentSection.path}.${siblingCount}`;
        } else {
            const rootCount = createdSections.filter(s => !s.parentId).length;
            section.path = rootCount.toString();
        }
        
        await section.save({ session });
        createdSections.push(section);
        sectionMap.set(sectionData.level, section);
        
        // Update parent's children array
        if (parentSection) {
            await Section.findByIdAndUpdate(
                parentSection._id,
                { 
                    $push: { children: section._id },
                    hasChildren: true
                },
                { session }
            );
        }
    }
    
    return createdSections[0]; // Return first section for stats calculation
}

/**
 * Basic markdown to HTML conversion
 */
function convertMarkdownToHTML(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

/**
 * Rollback migration (for testing purposes)
 */
export async function rollbackMigration() {
    console.log('Rolling back Course Schema Migration...');
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Remove all sections
        await Section.deleteMany({}, { session });
        
        // Remove new fields from courses
        await Course.updateMany(
            {},
            {
                $unset: {
                    generationMeta: '',
                    status: '',
                    settings: '',
                    sections: '',
                    stats: ''
                }
            },
            { session }
        );
        
        await session.commitTransaction();
        console.log('Rollback completed successfully!');
        
    } catch (error) {
        await session.abortTransaction();
        console.error('Rollback failed:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Verify migration integrity
 */
export async function verifyMigration() {
    console.log('Verifying migration integrity...');
    
    const issues = [];
    
    // Check courses
    const courses = await Course.find({});
    for (const course of courses) {
        if (!course.stats) {
            issues.push(`Course ${course._id} missing stats`);
        }
        if (!course.settings) {
            issues.push(`Course ${course._id} missing settings`);
        }
    }
    
    // Check sections
    const sections = await Section.find({});
    for (const section of sections) {
        if (!section.path) {
            issues.push(`Section ${section._id} missing path`);
        }
        if (section.parentId) {
            const parent = await Section.findById(section.parentId);
            if (!parent) {
                issues.push(`Section ${section._id} has invalid parent reference`);
            }
        }
    }
    
    if (issues.length === 0) {
        console.log('Migration verification passed!');
        return { success: true, issues: [] };
    } else {
        console.log(`Migration verification found ${issues.length} issues:`);
        issues.forEach(issue => console.log(`- ${issue}`));
        return { success: false, issues };
    }
}

export default {
    migrateCourseSchema,
    rollbackMigration,
    verifyMigration
};

/**
 * Enhanced content migration with intelligent section splitting
 */
async function migrateContentToSections(course, session, dryRun = false) {
    const content = course.content;
    const analysis = analyzeContentStructure(content);
    
    let sectionIds = [];
    let totalWords = 0;
    
    if (analysis.sections.length === 1) {
        // Single section content
        const section = await createSingleSection(course, analysis.sections[0], session, dryRun);
        if (section) {
            sectionIds = [section._id];
            totalWords = section.wordCount || 0;
        }
    } else if (analysis.sections.length > 1) {
        // Multi-section content
        const sections = await createHierarchicalSections(course, analysis.sections, session, dryRun);
        sectionIds = sections.map(s => s._id);
        totalWords = sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);
    }
    
    return {
        sectionIds,
        stats: {
            totalSections: sectionIds.length,
            totalWords,
            estimatedReadTime: Math.ceil(totalWords / 200)
        }
    };
}

/**
 * Enhanced content structure analysis
 */
function analyzeContentStructure(content) {
    if (!content || content.trim().length === 0) {
        return { sections: [], structure: 'empty' };
    }
    
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    
    // Detect different header patterns
    const headerPatterns = [
        /^#{1,6}\s+(.+)$/,           // Markdown headers
        /^(.+)\n[=-]{3,}$/,         // Underlined headers
        /^\d+\.\s+(.+)$/,           // Numbered sections
        /^[A-Z][^.!?]*:$/,          // Title case with colon
        /^[A-Z\s]{3,}$/             // ALL CAPS titles
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        
        let isHeader = false;
        let headerLevel = 0;
        let headerTitle = '';
        
        // Check each header pattern
        for (const pattern of headerPatterns) {
            const match = line.match(pattern);
            if (match) {
                isHeader = true;
                headerTitle = match[1] || line;
                
                // Determine level based on pattern type
                if (pattern.source.includes('#{1,6}')) {
                    headerLevel = (line.match(/^#+/) || [''])[0].length - 1;
                } else if (pattern.source.includes('[=-]')) {
                    headerLevel = nextLine.includes('=') ? 0 : 1;
                } else if (pattern.source.includes('\\d+')) {
                    headerLevel = 1;
                } else {
                    headerLevel = 0;
                }
                break;
            }
        }
        
        // Special case for underlined headers
        if (!isHeader && nextLine.match(/^[=-]{3,}$/)) {
            isHeader = true;
            headerTitle = line;
            headerLevel = nextLine.includes('=') ? 0 : 1;
            i++; // Skip the underline
        }
        
        if (isHeader) {
            // Save previous section
            if (currentSection && currentSection.content.trim().length > 0) {
                sections.push(currentSection);
            }
            
            // Start new section
            currentSection = {
                title: headerTitle || 'Untitled Section',
                content: '',
                level: Math.min(headerLevel, 2), // Cap at level 2 for migration
                startLine: i
            };
        } else if (currentSection) {
            currentSection.content += line + '\n';
        } else {
            // Content before first header
            if (!currentSection) {
                currentSection = {
                    title: extractTitleFromContent(content) || 'Introduction',
                    content: '',
                    level: 0,
                    startLine: 0
                };
            }
            currentSection.content += line + '\n';
        }
    }
    
    // Add the last section
    if (currentSection && currentSection.content.trim().length > 0) {
        sections.push(currentSection);
    }
    
    // If no sections were created, create a single section
    if (sections.length === 0) {
        sections.push({
            title: extractTitleFromContent(content) || 'Content',
            content: content,
            level: 0,
            startLine: 0
        });
    }
    
    return {
        sections,
        structure: sections.length > 1 ? 'hierarchical' : 'flat',
        hasHeaders: sections.some(s => s.level > 0)
    };
}

/**
 * Extract title from content using various heuristics
 */
function extractTitleFromContent(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) return null;
    
    // Try first line if it looks like a title
    const firstLine = lines[0];
    if (firstLine.length < 100 && !firstLine.includes('.') && !firstLine.toLowerCase().startsWith('the ')) {
        return firstLine;
    }
    
    // Look for markdown header
    const headerMatch = firstLine.match(/^#+\s+(.+)$/);
    if (headerMatch) {
        return headerMatch[1];
    }
    
    // Look for underlined title
    if (lines.length > 1 && lines[1].match(/^[=-]{3,}$/)) {
        return firstLine;
    }
    
    // Extract from first sentence
    const firstSentence = content.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 100) {
        return firstSentence.trim();
    }
    
    return null;
}
/**
 * Helper functions for intelligent migration
 */
function mapLegacyType(legacyType) {
    const typeMap = {
        'course': 'guide',
        'tutorial': 'tutorial',
        'guide': 'guide',
        'article': 'article',
        'documentation': 'documentation',
        'book': 'book'
    };
    return typeMap[legacyType] || 'guide';
}

function mapLegacyStatus(course) {
    if (course.completed) return 'completed';
    if (course.content && course.content.length > 1000) return 'in_progress';
    return 'draft';
}

function determineOptimalNestingDepth(content) {
    if (!content) return 3;
    
    const headerCount = (content.match(/^#+/gm) || []).length;
    const maxHeaderLevel = Math.max(...(content.match(/^#+/gm) || ['']).map(h => h.length));
    
    if (headerCount > 20 || maxHeaderLevel > 4) return 5;
    if (headerCount > 10 || maxHeaderLevel > 3) return 4;
    if (headerCount > 5 || maxHeaderLevel > 2) return 3;
    return 2;
}

function shouldShowTOC(content) {
    if (!content) return false;
    const headerCount = (content.match(/^#+/gm) || []).length;
    return headerCount >= 3;
}

function determineStructureType(content) {
    if (!content) return 'flat';
    const headerCount = (content.match(/^#+/gm) || []).length;
    const maxHeaderLevel = Math.max(...(content.match(/^#+/gm) || ['']).map(h => h.length));
    
    return (headerCount >= 3 || maxHeaderLevel >= 3) ? 'hierarchical' : 'flat';
}

/**
 * Create enhanced single section with proper content conversion
 */
async function createSingleSection(course, sectionData, session, dryRun = false) {
    const section = new Section({
        courseId: course._id,
        parentId: null,
        level: 0,
        path: '0',
        order: 0,
        title: sectionData.title,
        slug: generateSlug(sectionData.title),
        content: {
            markdown: {
                text: sectionData.content.trim(),
                generatedAt: course.date || course.createdAt || new Date()
            },
            html: {
                text: contentConverter.markdownToHtml(sectionData.content.trim()),
                generatedAt: course.date || course.createdAt || new Date()
            },
            primaryFormat: 'markdown'
        },
        hasContent: true,
        hasChildren: false,
        generationMeta: {
            prompt: course.userPrompt || null,
            model: course.model || null,
            generatedAt: course.date || course.createdAt || new Date()
        }
    });
    
    // Calculate statistics
    section.wordCount = contentConverter.calculateWordCount(sectionData.content, 'markdown');
    section.readTime = contentConverter.calculateReadTime(section.wordCount);
    
    if (!dryRun) {
        await section.save({ session });
    }
    
    return section;
}

/**
 * Create hierarchical sections with proper parent-child relationships
 */
async function createHierarchicalSections(course, sectionsData, session, dryRun = false) {
    const createdSections = [];
    const sectionStack = []; // Stack to track parent sections at each level
    
    for (let i = 0; i < sectionsData.length; i++) {
        const sectionData = sectionsData[i];
        
        // Determine parent based on level
        let parentSection = null;
        if (sectionData.level > 0) {
            // Find the most recent section at the parent level
            for (let j = sectionStack.length - 1; j >= 0; j--) {
                if (sectionStack[j].level < sectionData.level) {
                    parentSection = sectionStack[j];
                    break;
                }
            }
        }
        
        const section = new Section({
            courseId: course._id,
            parentId: parentSection ? parentSection._id : null,
            level: sectionData.level,
            order: i,
            title: sectionData.title,
            slug: generateSlug(sectionData.title),
            content: {
                markdown: {
                    text: sectionData.content.trim(),
                    generatedAt: course.date || course.createdAt || new Date()
                },
                html: {
                    text: contentConverter.markdownToHtml(sectionData.content.trim()),
                    generatedAt: course.date || course.createdAt || new Date()
                },
                primaryFormat: 'markdown'
            },
            hasContent: true,
            hasChildren: false,
            generationMeta: {
                prompt: course.userPrompt || null,
                model: course.model || null,
                generatedAt: course.date || course.createdAt || new Date()
            }
        });
        
        // Generate path
        if (parentSection) {
            const siblingCount = createdSections.filter(s => 
                s.parentId && s.parentId.equals(parentSection._id)
            ).length;
            section.path = `${parentSection.path}.${siblingCount}`;
        } else {
            const rootCount = createdSections.filter(s => !s.parentId).length;
            section.path = rootCount.toString();
        }
        
        // Calculate statistics
        section.wordCount = contentConverter.calculateWordCount(sectionData.content, 'markdown');
        section.readTime = contentConverter.calculateReadTime(section.wordCount);
        
        if (!dryRun) {
            await section.save({ session });
            
            // Update parent's children array
            if (parentSection) {
                await Section.findByIdAndUpdate(
                    parentSection._id,
                    { 
                        $push: { children: section._id },
                        hasChildren: true
                    },
                    { session }
                );
            }
        }
        
        createdSections.push(section);
        
        // Update section stack
        sectionStack.push(section);
        
        // Remove sections from stack that are at the same or deeper level
        while (sectionStack.length > 1 && 
               sectionStack[sectionStack.length - 2].level >= sectionData.level) {
            sectionStack.pop();
        }
    }
    
    return createdSections;
}