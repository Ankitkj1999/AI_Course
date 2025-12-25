import mongoose from 'mongoose';

/**
 * Enhanced Notes Model
 * Supports both course-level and section-level notes
 */
const notesSchema = new mongoose.Schema({
    // User who created the notes
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    
    // Course reference (always required)
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true, 
        index: true 
    },
    
    // Section reference (optional - null means course-level notes)
    sectionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Section', 
        default: null, 
        index: true 
    },
    
    // Notes content
    notes: { 
        type: String, 
        required: true 
    },
    
    // Notes metadata
    title: { 
        type: String, 
        default: '' 
    },
    
    // Notes format
    format: {
        type: String,
        enum: ['plain', 'markdown', 'html'],
        default: 'plain'
    },
    
    // Tags for organization
    tags: [{
        type: String,
        trim: true
    }],
    
    // Privacy settings
    isPrivate: { 
        type: Boolean, 
        default: true 
    },
    
    // Legacy course field for backward compatibility
    course: { 
        type: String, 
        index: true 
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
notesSchema.index({ userId: 1, courseId: 1 });
notesSchema.index({ userId: 1, courseId: 1, sectionId: 1 });
notesSchema.index({ courseId: 1, sectionId: 1 });

// Pre-save middleware to maintain backward compatibility
notesSchema.pre('save', async function(next) {
    try {
        // Set legacy course field if courseId is provided
        if (this.courseId && !this.course) {
            const Course = mongoose.model('Course');
            const course = await Course.findById(this.courseId).select('slug');
            if (course) {
                this.course = course.slug;
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
notesSchema.methods.getScope = function() {
    return this.sectionId ? 'section' : 'course';
};

notesSchema.methods.getReference = function() {
    return {
        type: this.getScope(),
        courseId: this.courseId,
        sectionId: this.sectionId,
        course: this.course // Legacy field
    };
};

// Static methods
notesSchema.statics.findByUser = function(userId, options = {}) {
    const { courseId, sectionId, includePrivate = true } = options;
    
    const query = { userId };
    if (courseId) query.courseId = courseId;
    if (sectionId !== undefined) query.sectionId = sectionId;
    if (!includePrivate) query.isPrivate = false;
    
    return this.find(query).sort({ updatedAt: -1 });
};

notesSchema.statics.findByCourse = function(courseId, options = {}) {
    const { userId, sectionId, includePrivate = false } = options;
    
    const query = { courseId };
    if (userId) query.userId = userId;
    if (sectionId !== undefined) query.sectionId = sectionId;
    if (!includePrivate) query.isPrivate = false;
    
    return this.find(query).sort({ updatedAt: -1 });
};

notesSchema.statics.findBySection = function(sectionId, options = {}) {
    const { userId, includePrivate = false } = options;
    
    const query = { sectionId };
    if (userId) query.userId = userId;
    if (!includePrivate) query.isPrivate = false;
    
    return this.find(query).sort({ updatedAt: -1 });
};

// Migration helper for existing notes
notesSchema.statics.migrateFromLegacy = async function(legacyNotes) {
    const Course = mongoose.model('Course');
    const migrated = [];
    
    for (const note of legacyNotes) {
        try {
            // Find course by slug (legacy course field)
            const course = await Course.findOne({ slug: note.course });
            if (!course) {
                console.warn(`Course not found for legacy note: ${note.course}`);
                continue;
            }
            
            // Create new note with enhanced schema
            const newNote = new this({
                userId: note.userId || 'unknown', // May need to be set manually
                courseId: course._id,
                sectionId: null, // Course-level notes
                notes: note.notes,
                course: note.course, // Maintain legacy field
                format: 'plain', // Default format for legacy notes
                isPrivate: true // Default to private
            });
            
            await newNote.save();
            migrated.push(newNote);
        } catch (error) {
            console.error(`Failed to migrate note for course ${note.course}:`, error);
        }
    }
    
    return migrated;
};

export default mongoose.model('Notes', notesSchema);