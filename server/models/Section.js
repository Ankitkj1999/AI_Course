import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    // Parent References
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true, 
        index: true 
    },
    parentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Section', 
        default: null, 
        index: true 
    },
    
    // Section Metadata
    title: { 
        type: String, 
        required: true 
    },
    slug: { 
        type: String, 
        required: true 
    },
    
    // Hierarchical Structure
    path: { 
        type: String, 
        index: true 
    },
    level: { 
        type: Number, 
        default: 1 
    },
    order: { 
        type: Number, 
        default: 0 
    },
    
    // Multi-format content storage
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: function() {
            return {
                markdown: { text: '', generatedAt: null },
                html: { text: '', generatedAt: null },
                lexical: { editorState: null, lastEditedAt: null },
                primaryFormat: 'markdown',
                metadata: {
                    wordCount: 0,
                    readTime: 0,
                    hasContent: false
                }
            };
        }
    },
    
    // Child Management
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    }],
    
    // Content flags
    hasContent: { 
        type: Boolean, 
        default: false 
    },
    hasChildren: { 
        type: Boolean, 
        default: false 
    },
    
    // Content statistics
    wordCount: { 
        type: Number, 
        default: 0 
    },
    readTime: { 
        type: Number, 
        default: 0 
    },
    
    // Version history
    versions: [{
        format: { type: String, enum: ['markdown', 'html', 'lexical'] },
        content: mongoose.Schema.Types.Mixed,
        savedAt: { type: Date, default: Date.now },
        savedBy: { type: String }
    }],
    
    // Settings
    settings: {
        order: { type: Number, default: 0 },
        icon: { type: String },
        color: { type: String },
        isCollapsed: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Indexes for performance
sectionSchema.index({ courseId: 1, path: 1 });
sectionSchema.index({ courseId: 1, parentId: 1, order: 1 });
sectionSchema.index({ courseId: 1, level: 1 });

// Pre-save middleware to calculate path and level
sectionSchema.pre('save', async function(next) {
    try {
        if (this.isNew || this.isModified('parentId')) {
            await this.generatePath();
        }
        
        // Update content statistics
        if (this.isModified('content')) {
            this.updateContentStats();
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Method to generate hierarchical path
sectionSchema.methods.generatePath = async function() {
    if (this.parentId) {
        const parent = await this.constructor.findById(this.parentId);
        if (parent) {
            this.level = parent.level + 1;
            const siblingCount = await this.constructor.countDocuments({
                parentId: this.parentId,
                _id: { $ne: this._id }
            });
            this.path = `${parent.path}.${siblingCount}`;
        }
    } else {
        this.level = 1;
        const rootCount = await this.constructor.countDocuments({
            courseId: this.courseId,
            parentId: null,
            _id: { $ne: this._id }
        });
        this.path = rootCount.toString();
    }
};

// Method to update content statistics
sectionSchema.methods.updateContentStats = function() {
    const primaryFormat = this.content.primaryFormat || 'markdown';
    const contentData = this.content[primaryFormat];
    
    if (contentData && contentData.text) {
        // Calculate word count
        const text = contentData.text.replace(/<[^>]*>/g, ''); // Strip HTML tags
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        this.wordCount = words.length;
        
        // Calculate read time (200 words per minute)
        this.readTime = Math.ceil(this.wordCount / 200);
        
        // Update hasContent flag
        this.hasContent = this.wordCount > 0;
        
        // Update metadata
        if (this.content.metadata) {
            this.content.metadata.wordCount = this.wordCount;
            this.content.metadata.readTime = this.readTime;
            this.content.metadata.hasContent = this.hasContent;
        }
    } else {
        this.wordCount = 0;
        this.readTime = 0;
        this.hasContent = false;
        
        if (this.content.metadata) {
            this.content.metadata.wordCount = 0;
            this.content.metadata.readTime = 0;
            this.content.metadata.hasContent = false;
        }
    }
};

// Static method to validate nesting depth
sectionSchema.statics.validateNestingDepth = async function(courseId, parentId, maxDepth) {
    if (!parentId) return true;
    
    const parent = await this.findById(parentId);
    if (!parent) throw new Error('Parent section not found');
    
    if (parent.level >= maxDepth) {
        throw new Error(`Maximum nesting depth of ${maxDepth} exceeded`);
    }
    
    return true;
};

export default mongoose.model('Section', sectionSchema);