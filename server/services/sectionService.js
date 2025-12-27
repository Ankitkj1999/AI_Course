import { Section, Course } from '../models/index.js';
import mongoose from 'mongoose';
import ContentManager from './contentManager.js';

/**
 * Section Management Service
 * Provides utilities for managing hierarchical sections with enhanced operations
 */
class SectionService {
    
    /**
     * Create a new section with proper hierarchy validation
     */
    static async createSection(sectionData) {
        const { courseId, parentId, title, content, settings } = sectionData;
        
        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        // Validate nesting depth if parent exists
        if (parentId) {
            await Section.validateNestingDepth(courseId, parentId, course.settings.maxNestingDepth);
        }
        
        // Create section
        const section = new Section({
            courseId,
            parentId,
            title,
            slug: this.generateSlug(title),
            content: content || {},
            settings: settings || {}
        });
        
        await section.save();
        
        // Update parent's children array if applicable
        if (parentId) {
            await Section.findByIdAndUpdate(parentId, {
                $push: { children: section._id },
                hasChildren: true
            });
        }
        
        // Update course's sections array
        await Course.findByIdAndUpdate(courseId, {
            $push: { sections: section._id }
        });
        
        return section;
    }
    
    /**
     * Update section content and metadata
     */
    static async updateSection(sectionId, updateData) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        // Handle content updates
        if (updateData.content) {
            // Store previous version in history
            if (section.content.primaryFormat && section.content[section.content.primaryFormat]) {
                section.versions.push({
                    format: section.content.primaryFormat,
                    content: section.content[section.content.primaryFormat],
                    savedAt: new Date(),
                    savedBy: updateData.userId || 'system'
                });
            }
            
            // Update content
            Object.assign(section.content, updateData.content);
            
            // CRITICAL: Mark content as modified for Mongoose to detect changes
            section.markModified('content');
        }
        
        // Update other fields
        const allowedFields = ['title', 'icon', 'settings'];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                section[field] = updateData[field];
            }
        });
        
        // Update slug if title changed
        if (updateData.title) {
            section.slug = this.generateSlug(updateData.title);
        }
        
        await section.save();
        return section;
    }
    
    /**
     * Delete section and handle hierarchy cleanup
     */
    static async deleteSection(sectionId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const section = await Section.findById(sectionId).session(session);
            if (!section) {
                throw new Error('Section not found');
            }
            
            // Recursively delete all children
            if (section.children.length > 0) {
                for (const childId of section.children) {
                    await this.deleteSection(childId);
                }
            }
            
            // Remove from parent's children array
            if (section.parentId) {
                await Section.findByIdAndUpdate(
                    section.parentId,
                    { $pull: { children: sectionId } },
                    { session }
                );
                
                // Update parent's hasChildren flag
                const parent = await Section.findById(section.parentId).session(session);
                if (parent && parent.children.length <= 1) {
                    parent.hasChildren = false;
                    await parent.save({ session });
                }
            }
            
            // Remove from course's sections array
            await Course.findByIdAndUpdate(
                section.courseId,
                { $pull: { sections: sectionId } },
                { session }
            );
            
            // Delete the section
            await Section.findByIdAndDelete(sectionId).session(session);
            
            await session.commitTransaction();
            return { success: true, deletedSectionId: sectionId };
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Move section to a new parent
     */
    static async moveSection(sectionId, newParentId, newOrder = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const section = await Section.findById(sectionId).session(session);
            if (!section) {
                throw new Error('Section not found');
            }
            
            const oldParentId = section.parentId;
            
            // Validate new parent if provided
            if (newParentId) {
                const newParent = await Section.findById(newParentId).session(session);
                if (!newParent) {
                    throw new Error('New parent section not found');
                }
                
                // Validate nesting depth
                const course = await Course.findById(section.courseId).session(session);
                await Section.validateNestingDepth(section.courseId, newParentId, course.settings.maxNestingDepth);
            }
            
            // Remove from old parent
            if (oldParentId) {
                await Section.findByIdAndUpdate(
                    oldParentId,
                    { $pull: { children: sectionId } },
                    { session }
                );
            }
            
            // Add to new parent
            if (newParentId) {
                await Section.findByIdAndUpdate(
                    newParentId,
                    { 
                        $push: { children: sectionId },
                        hasChildren: true
                    },
                    { session }
                );
            }
            
            // Update section's parent reference
            section.parentId = newParentId;
            section.order = newOrder !== null ? newOrder : section.order;
            
            // Regenerate path
            await section.generatePath();
            await section.save({ session });
            
            await session.commitTransaction();
            return section;
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Get section hierarchy for a course
     */
    static async getCourseHierarchy(courseId, options = {}) {
        const { includeContent = false, maxDepth = null } = options;
        
        const pipeline = [
            { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
            { $sort: { path: 1 } }
        ];
        
        if (maxDepth !== null) {
            pipeline.push({ $match: { level: { $lte: maxDepth } } });
        }
        
        if (!includeContent) {
            pipeline.push({
                $project: {
                    content: 0,
                    versions: 0
                }
            });
        }
        
        const sections = await Section.aggregate(pipeline);
        return this.buildHierarchyTree(sections);
    }
    
    /**
     * Build hierarchical tree structure from flat section array
     */
    static buildHierarchyTree(sections) {
        const sectionMap = new Map();
        const rootSections = [];
        
        // Create map of all sections
        sections.forEach(section => {
            section.children = [];
            sectionMap.set(section._id.toString(), section);
        });
        
        // Build hierarchy
        sections.forEach(section => {
            if (section.parentId) {
                const parent = sectionMap.get(section.parentId.toString());
                if (parent) {
                    parent.children.push(section);
                }
            } else {
                rootSections.push(section);
            }
        });
        
        return rootSections;
    }
    
    /**
     * Generate URL-friendly slug from title
     */
    static generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    /**
     * Convert content between formats
     */
    static async convertContent(content, fromFormat, toFormat) {
        // This is a placeholder for content conversion logic
        // In a real implementation, you'd have converters for:
        // - Markdown to HTML
        // - HTML to Markdown
        // - Lexical JSON to HTML
        // - HTML to Lexical JSON
        
        if (fromFormat === toFormat) {
            return content;
        }
        
        // Basic markdown to HTML conversion
        if (fromFormat === 'markdown' && toFormat === 'html') {
            // You could use a library like marked or showdown here
            return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                         .replace(/\*(.*?)\*/g, '<em>$1</em>')
                         .replace(/\n/g, '<br>');
        }
        
        // Basic HTML to markdown conversion
        if (fromFormat === 'html' && toFormat === 'markdown') {
            return content.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                         .replace(/<em>(.*?)<\/em>/g, '*$1*')
                         .replace(/<br>/g, '\n');
        }
        
        return content;
    }
    
    /**
     * Reorder sections within the same parent
     */
    static async reorderSections(sectionIds, parentId = null, courseId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Validate all sections belong to the same parent and course
            const sections = await Section.find({ 
                _id: { $in: sectionIds },
                courseId: new mongoose.Types.ObjectId(courseId),
                parentId: parentId
            }).session(session);
            
            if (sections.length !== sectionIds.length) {
                throw new Error('Some sections not found or do not belong to the specified parent');
            }
            
            // Update order for each section
            for (let i = 0; i < sectionIds.length; i++) {
                await Section.findByIdAndUpdate(
                    sectionIds[i],
                    { 
                        order: i,
                        // Regenerate path if needed
                        path: await this.generateSectionPath(sectionIds[i], parentId, i)
                    },
                    { session }
                );
            }
            
            // Update parent's children array to match new order
            if (parentId) {
                await Section.findByIdAndUpdate(
                    parentId,
                    { children: sectionIds },
                    { session }
                );
            } else {
                // Update course's sections array for root-level sections
                const course = await Course.findById(courseId).session(session);
                const rootSections = sectionIds;
                const nonRootSections = course.sections.filter(id => 
                    !rootSections.includes(id.toString())
                );
                course.sections = [...rootSections, ...nonRootSections];
                await course.save({ session });
            }
            
            await session.commitTransaction();
            
            // Return updated sections
            return await Section.find({ _id: { $in: sectionIds } }).sort({ order: 1 });
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Duplicate a section with all its content and children
     */
    static async duplicateSection(sectionId, options = {}) {
        const { 
            newTitle = null, 
            includeChildren = true, 
            newParentId = null,
            userId = null 
        } = options;
        
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const originalSection = await Section.findById(sectionId).session(session);
            if (!originalSection) {
                throw new Error('Section not found');
            }
            
            // Create duplicate section
            const duplicateData = {
                ...originalSection.toObject(),
                _id: new mongoose.Types.ObjectId(),
                title: newTitle || `${originalSection.title} (Copy)`,
                slug: this.generateSlug(newTitle || `${originalSection.title} (Copy)`),
                parentId: newParentId || originalSection.parentId,
                children: [], // Will be populated if includeChildren is true
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Generate new path
            duplicateData.path = await this.generateNewSectionPath(
                duplicateData.courseId,
                duplicateData.parentId
            );
            
            const duplicateSection = new Section(duplicateData);
            await duplicateSection.save({ session });
            
            // Update parent's children array
            if (duplicateSection.parentId) {
                await Section.findByIdAndUpdate(
                    duplicateSection.parentId,
                    { 
                        $push: { children: duplicateSection._id },
                        hasChildren: true
                    },
                    { session }
                );
            }
            
            // Update course's sections array
            await Course.findByIdAndUpdate(
                duplicateSection.courseId,
                { $push: { sections: duplicateSection._id } },
                { session }
            );
            
            // Duplicate children recursively if requested
            if (includeChildren && originalSection.children.length > 0) {
                const childrenMap = new Map();
                
                for (const childId of originalSection.children) {
                    const duplicateChild = await this.duplicateSection(
                        childId,
                        {
                            newParentId: duplicateSection._id,
                            includeChildren: true,
                            userId
                        }
                    );
                    childrenMap.set(childId.toString(), duplicateChild._id);
                    duplicateSection.children.push(duplicateChild._id);
                }
                
                duplicateSection.hasChildren = true;
                await duplicateSection.save({ session });
            }
            
            await session.commitTransaction();
            return duplicateSection;
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Bulk operations on multiple sections
     */
    static async bulkOperations(operation, sectionIds, options = {}) {
        const { userId, courseId } = options;
        
        switch (operation) {
            case 'delete':
                return await this.bulkDeleteSections(sectionIds, userId);
            case 'move':
                return await this.bulkMoveSections(sectionIds, options.newParentId, userId);
            case 'duplicate':
                return await this.bulkDuplicateSections(sectionIds, options);
            case 'reorder':
                return await this.reorderSections(sectionIds, options.parentId, courseId);
            default:
                throw new Error(`Unsupported bulk operation: ${operation}`);
        }
    }
    
    /**
     * Bulk delete multiple sections
     */
    static async bulkDeleteSections(sectionIds, userId) {
        const results = [];
        const errors = [];
        
        for (const sectionId of sectionIds) {
            try {
                const result = await this.deleteSection(sectionId);
                results.push({ sectionId, success: true, result });
            } catch (error) {
                errors.push({ sectionId, success: false, error: error.message });
            }
        }
        
        return { results, errors };
    }
    
    /**
     * Bulk move multiple sections to a new parent
     */
    static async bulkMoveSections(sectionIds, newParentId, userId) {
        const results = [];
        const errors = [];
        
        for (let i = 0; i < sectionIds.length; i++) {
            try {
                const result = await this.moveSection(sectionIds[i], newParentId, i);
                results.push({ sectionId: sectionIds[i], success: true, result });
            } catch (error) {
                errors.push({ sectionId: sectionIds[i], success: false, error: error.message });
            }
        }
        
        return { results, errors };
    }
    
    /**
     * Bulk duplicate multiple sections
     */
    static async bulkDuplicateSections(sectionIds, options = {}) {
        const results = [];
        const errors = [];
        
        for (const sectionId of sectionIds) {
            try {
                const result = await this.duplicateSection(sectionId, options);
                results.push({ originalId: sectionId, success: true, duplicate: result });
            } catch (error) {
                errors.push({ originalId: sectionId, success: false, error: error.message });
            }
        }
        
        return { results, errors };
    }
    
    /**
     * Get section by ID
     */
    static async getSection(sectionId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            return null;
        }
        return section;
    }
    
    /**
     * Get section with all descendants
     */
    static async getSectionWithDescendants(sectionId, options = {}) {
        const { includeContent = false, maxDepth = null } = options;
        
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        // Build query for descendants
        const pathRegex = new RegExp(`^${section.path}\\.`);
        const query = {
            courseId: section.courseId,
            path: pathRegex
        };
        
        if (maxDepth !== null) {
            query.level = { $lte: section.level + maxDepth };
        }
        
        const descendants = await Section.find(query).sort({ path: 1 });
        
        // Build hierarchical structure
        const sectionWithDescendants = section.toObject();
        sectionWithDescendants.descendants = this.buildHierarchyTree([section, ...descendants]);
        
        if (!includeContent) {
            // Remove content from all sections for performance
            this.removeContentFromTree(sectionWithDescendants.descendants);
        }
        
        return sectionWithDescendants;
    }
    
    /**
     * Merge two sections (combine content and move children)
     */
    static async mergeSections(sourceSectionId, targetSectionId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const sourceSection = await Section.findById(sourceSectionId).session(session);
            const targetSection = await Section.findById(targetSectionId).session(session);
            
            if (!sourceSection || !targetSection) {
                throw new Error('One or both sections not found');
            }
            
            if (sourceSection.courseId.toString() !== targetSection.courseId.toString()) {
                throw new Error('Cannot merge sections from different courses');
            }
            
            // Save version of target section before merge
            await ContentManager.updateSectionContent(
                targetSectionId,
                {
                    content: targetSection.content[targetSection.content.primaryFormat]?.text || '',
                    format: targetSection.content.primaryFormat,
                    changeDescription: `Before merge with section: ${sourceSection.title}`
                },
                userId
            );
            
            // Combine content
            const sourceContent = sourceSection.content[sourceSection.content.primaryFormat]?.text || '';
            const targetContent = targetSection.content[targetSection.content.primaryFormat]?.text || '';
            const mergedContent = targetContent + '\n\n' + sourceContent;
            
            // Update target section with merged content
            await ContentManager.updateSectionContent(
                targetSectionId,
                {
                    content: mergedContent,
                    format: targetSection.content.primaryFormat,
                    saveVersion: false, // Already saved above
                    changeDescription: `Merged with section: ${sourceSection.title}`
                },
                userId
            );
            
            // Move source section's children to target section
            if (sourceSection.children.length > 0) {
                for (const childId of sourceSection.children) {
                    await this.moveSection(childId, targetSectionId);
                }
            }
            
            // Delete source section
            await this.deleteSection(sourceSectionId);
            
            await session.commitTransaction();
            
            // Return updated target section
            return await Section.findById(targetSectionId);
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Split a section into multiple sections
     */
    static async splitSection(sectionId, splitPoints, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const originalSection = await Section.findById(sectionId).session(session);
            if (!originalSection) {
                throw new Error('Section not found');
            }
            
            const content = originalSection.content[originalSection.content.primaryFormat]?.text || '';
            const lines = content.split('\n');
            
            // Validate split points
            splitPoints.sort((a, b) => a - b);
            if (splitPoints.some(point => point < 0 || point >= lines.length)) {
                throw new Error('Invalid split points');
            }
            
            const newSections = [];
            let lastSplitPoint = 0;
            
            // Create new sections for each split
            for (let i = 0; i < splitPoints.length; i++) {
                const splitPoint = splitPoints[i];
                const sectionContent = lines.slice(lastSplitPoint, splitPoint).join('\n');
                
                if (sectionContent.trim()) {
                    const newSection = await this.createSection({
                        courseId: originalSection.courseId,
                        parentId: originalSection.parentId,
                        title: `${originalSection.title} - Part ${i + 1}`,
                        content: {
                            [originalSection.content.primaryFormat]: {
                                text: sectionContent
                            },
                            primaryFormat: originalSection.content.primaryFormat
                        }
                    });
                    
                    newSections.push(newSection);
                }
                
                lastSplitPoint = splitPoint;
            }
            
            // Create final section with remaining content
            const remainingContent = lines.slice(lastSplitPoint).join('\n');
            if (remainingContent.trim()) {
                const finalSection = await this.createSection({
                    courseId: originalSection.courseId,
                    parentId: originalSection.parentId,
                    title: `${originalSection.title} - Part ${splitPoints.length + 1}`,
                    content: {
                        [originalSection.content.primaryFormat]: {
                            text: remainingContent
                        },
                        primaryFormat: originalSection.content.primaryFormat
                    }
                });
                
                newSections.push(finalSection);
            }
            
            // Move original section's children to the last new section
            if (originalSection.children.length > 0 && newSections.length > 0) {
                const lastSection = newSections[newSections.length - 1];
                for (const childId of originalSection.children) {
                    await this.moveSection(childId, lastSection._id);
                }
            }
            
            // Delete original section
            await this.deleteSection(sectionId);
            
            await session.commitTransaction();
            return newSections;
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Helper: Generate path for a section at a specific position
     */
    static async generateSectionPath(sectionId, parentId, order) {
        if (parentId) {
            const parent = await Section.findById(parentId);
            return `${parent.path}.${order}`;
        } else {
            return order.toString();
        }
    }
    
    /**
     * Helper: Generate new path for a section
     */
    static async generateNewSectionPath(courseId, parentId) {
        if (parentId) {
            const parent = await Section.findById(parentId);
            const siblingCount = await Section.countDocuments({ parentId });
            return `${parent.path}.${siblingCount}`;
        } else {
            const rootCount = await Section.countDocuments({ 
                courseId, 
                parentId: null 
            });
            return rootCount.toString();
        }
    }
    
    /**
     * Helper: Remove content from tree structure for performance
     */
    static removeContentFromTree(sections) {
        sections.forEach(section => {
            delete section.content;
            delete section.versions;
            if (section.children) {
                this.removeContentFromTree(section.children);
            }
        });
    }
    
    /**
     * Get section analytics
     */
    static async getSectionAnalytics(sectionId) {
        const section = await Section.findById(sectionId);
        if (!section) {
            throw new Error('Section not found');
        }
        
        // Get descendants
        const pathRegex = new RegExp(`^${section.path}\\.`);
        const descendants = await Section.find({
            courseId: section.courseId,
            path: pathRegex
        });
        
        const analytics = {
            section: {
                id: section._id,
                title: section.title,
                level: section.level,
                path: section.path,
                wordCount: section.wordCount,
                readTime: section.readTime,
                hasContent: section.hasContent,
                hasChildren: section.hasChildren
            },
            hierarchy: {
                totalDescendants: descendants.length,
                maxDepth: descendants.length > 0 ? Math.max(...descendants.map(d => d.level)) : section.level,
                directChildren: section.children.length
            },
            content: {
                primaryFormat: section.content.primaryFormat,
                availableFormats: Object.keys(section.content).filter(key => 
                    key !== 'primaryFormat' && section.content[key]?.text
                ),
                totalVersions: section.versions.length,
                lastModified: section.updatedAt
            },
            statistics: {
                totalWords: section.wordCount + descendants.reduce((sum, d) => sum + (d.wordCount || 0), 0),
                totalReadTime: section.readTime + descendants.reduce((sum, d) => sum + (d.readTime || 0), 0),
                sectionsWithContent: descendants.filter(d => d.hasContent).length + (section.hasContent ? 1 : 0)
            }
        };
        
        return analytics;
    }
    
    /**
     * Validate section hierarchy integrity
     */
    static async validateHierarchy(courseId) {
        const sections = await Section.find({ courseId });
        const issues = [];
        
        for (const section of sections) {
            // Check parent reference
            if (section.parentId) {
                const parent = await Section.findById(section.parentId);
                if (!parent) {
                    issues.push({
                        type: 'orphaned_section',
                        sectionId: section._id,
                        message: 'Section has invalid parent reference'
                    });
                } else if (!parent.children.includes(section._id)) {
                    issues.push({
                        type: 'missing_child_reference',
                        sectionId: section._id,
                        parentId: parent._id,
                        message: 'Parent does not reference this section as child'
                    });
                }
            }
            
            // Check children references
            for (const childId of section.children) {
                const child = await Section.findById(childId);
                if (!child) {
                    issues.push({
                        type: 'invalid_child_reference',
                        sectionId: section._id,
                        childId: childId,
                        message: 'Section references non-existent child'
                    });
                } else if (!child.parentId || !child.parentId.equals(section._id)) {
                    issues.push({
                        type: 'mismatched_parent_child',
                        sectionId: section._id,
                        childId: childId,
                        message: 'Child does not reference this section as parent'
                    });
                }
            }
            
            // Check path consistency
            if (section.parentId) {
                const parent = await Section.findById(section.parentId);
                if (parent && !section.path.startsWith(parent.path + '.')) {
                    issues.push({
                        type: 'invalid_path',
                        sectionId: section._id,
                        message: 'Section path does not match parent hierarchy'
                    });
                }
            }
        }
        
        return {
            valid: issues.length === 0,
            issues,
            totalSections: sections.length
        };
    }
}

export default SectionService;