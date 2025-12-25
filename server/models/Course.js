import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    // Basic Info (existing fields maintained)
    user: { 
        type: String, 
        required: true, 
        index: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    slug: { 
        type: String, 
        unique: true, 
        index: true, 
        required: true 
    },
    mainTopic: { 
        type: String 
    },
    photo: { 
        type: String 
    },
    
    // Legacy content field (only for unmigrated legacy courses)
    // New courses should use the sections array instead
    content: { 
        type: String,
        default: null // Don't store content for new courses
    },
    
    // Enhanced Type System
    type: { 
        type: String, 
        enum: ['guide', 'tutorial', 'book', 'article', 'documentation'],
        default: 'guide'
    },
    
    // Dates
    date: { 
        type: Date, 
        default: Date.now 
    },
    end: { 
        type: Date, 
        default: Date.now 
    },
    completed: { 
        type: Boolean, 
        default: false 
    },
    
    // New: Generation Metadata
    generationMeta: {
        userPrompt: { type: String },
        model: { type: String },
        generatedAt: { type: Date, default: Date.now },
        lastModified: { type: Date, default: Date.now }
    },
    
    // Enhanced Status Tracking
    status: {
        type: String,
        enum: ['draft', 'in_progress', 'completed', 'archived'],
        default: 'draft'
    },
    
    // Existing Social Features (maintained)
    isPublic: { 
        type: Boolean, 
        default: false, 
        index: true 
    },
    forkCount: { 
        type: Number, 
        default: 0 
    },
    viewCount: { 
        type: Number, 
        default: 0 
    },
    forkedFrom: {
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null
        },
        originalOwnerId: { 
            type: String, 
            default: null 
        },
        originalOwnerName: { 
            type: String, 
            default: null 
        },
        forkedAt: { 
            type: Date, 
            default: null 
        }
    },
    ownerName: { 
        type: String, 
        default: '' 
    },
    
    // Document source tracking (existing)
    sourceDocument: {
        processingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DocumentProcessing'
        },
        filename: { type: String },
        extractedFrom: { 
            type: String, 
            enum: ['pdf', 'docx', 'txt', 'url'] 
        }
    },
    
    // New: Section References
    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    }],
    
    // New: Course Settings
    settings: {
        maxNestingDepth: { 
            type: Number, 
            default: 3, 
            min: 1, 
            max: 5 
        },
        allowComments: { 
            type: Boolean, 
            default: true 
        },
        showTableOfContents: { 
            type: Boolean, 
            default: true 
        },
        structure: {
            type: String,
            enum: ['flat', 'hierarchical'],
            default: 'hierarchical'
        }
    },
    
    // New: Aggregated Statistics
    stats: {
        totalSections: { 
            type: Number, 
            default: 0 
        },
        totalWords: { 
            type: Number, 
            default: 0 
        },
        estimatedReadTime: { 
            type: Number, 
            default: 0 
        }
    }
}, {
    timestamps: true
});

// Existing indexes
courseSchema.index({ user: 1, createdAt: -1 });
courseSchema.index({ isPublic: 1, date: -1 });

// New indexes for performance
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ type: 1, isPublic: 1 });

// Pre-save middleware to update statistics
courseSchema.pre('save', async function(next) {
    try {
        // Update generation metadata timestamp
        if (this.isModified() && !this.isNew) {
            this.generationMeta.lastModified = new Date();
        }
        
        // Calculate aggregated statistics if sections have changed
        if (this.isModified('sections') && this.sections.length > 0) {
            try {
                await this.calculateStats();
            } catch (statsError) {
                console.warn('Failed to calculate course stats:', statsError.message);
                // Don't fail the save for stats calculation errors
            }
        }
        
        next();
    } catch (error) {
        console.error('Course pre-save middleware error:', error);
        // Don't fail the save for non-critical errors
        next();
    }
});

// Method to calculate aggregated statistics
courseSchema.methods.calculateStats = async function() {
    const Section = mongoose.model('Section');
    
    // Get all sections for this course
    const sections = await Section.find({ courseId: this._id });
    
    this.stats.totalSections = sections.length;
    this.stats.totalWords = sections.reduce((total, section) => total + (section.wordCount || 0), 0);
    this.stats.estimatedReadTime = Math.ceil(this.stats.totalWords / 200); // 200 words per minute
};

// Method to add section reference
courseSchema.methods.addSection = function(sectionId) {
    if (!this.sections.includes(sectionId)) {
        this.sections.push(sectionId);
    }
};

// Method to remove section reference
courseSchema.methods.removeSection = function(sectionId) {
    this.sections = this.sections.filter(id => !id.equals(sectionId));
};

// Static method to get course with populated sections
courseSchema.statics.findWithSections = function(query, options = {}) {
    return this.findOne(query)
        .populate({
            path: 'sections',
            options: { sort: { path: 1 } },
            ...options.populateOptions
        });
};

// Static method to validate structure constraints
courseSchema.statics.validateStructure = async function(courseId, structure) {
    const course = await this.findById(courseId);
    if (!course) throw new Error('Course not found');
    
    if (structure === 'flat') {
        const Section = mongoose.model('Section');
        const nestedSections = await Section.find({ 
            courseId: courseId, 
            level: { $gt: 1 } 
        });
        
        if (nestedSections.length > 0) {
            throw new Error('Cannot set to flat structure: course has nested sections beyond level 1');
        }
    }
    
    return true;
};

export default mongoose.model('Course', courseSchema);