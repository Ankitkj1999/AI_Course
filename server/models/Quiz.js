import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
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
    format: { 
        type: String, 
        default: 'mixed' 
    },
    content: { 
        type: String, 
        required: true 
    }, // Quiz questions in markdown format
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
    questionAndAnswers: [
        {
            // Pre-quiz questions for customization
            role: { 
                type: String, 
                enum: ['assistant', 'user'] 
            },
            question: String,
            answer: String,
            possibleAnswers: [String]
        }
    ],
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
            ref: 'Quiz',
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
quizSchema.index({ isPublic: 1, createdAt: -1 });

export default mongoose.model('Quiz', quizSchema);