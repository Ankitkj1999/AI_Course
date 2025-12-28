import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    keyword: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    slug: { 
        type: String, 
        unique: true, 
        index: true 
    },
    content: { 
        type: String, 
        required: true 
    }, // Guide content in markdown format
    relatedTopics: [String], // Array of related topic suggestions
    deepDiveTopics: [String], // Array of advanced topics for further study
    questions: [String], // Array of study questions
    tokens: {
        prompt: { 
            type: Number, 
            default: 0 
        },
        completion: { 
            type: Number, 
            default: 0 
        },
        total: { 
            type: Number, 
            default: 0 
        }
    },
    viewCount: { 
        type: Number, 
        default: 0 
    },
    lastVisitedAt: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    // Visibility and fork fields
    isPublic: { 
        type: Boolean, 
        default: false, 
        index: true 
    },
    forkCount: { 
        type: Number, 
        default: 0 
    },
    forkedFrom: {
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guide',
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
    // Document source tracking
    sourceDocument: {
        processingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DocumentProcessing'
        },
        filename: { 
            type: String 
        },
        extractedFrom: { 
            type: String, 
            enum: ['pdf', 'docx', 'txt', 'url'] 
        }
    }
});

// Create compound index for efficient public content queries
guideSchema.index({ isPublic: 1, createdAt: -1 });

export default mongoose.model('Guide', guideSchema);