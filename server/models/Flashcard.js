import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
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
    }, // Flashcards in markdown format
    cards: [
        {
            front: { 
                type: String, 
                required: true 
            },
            back: { 
                type: String, 
                required: true 
            },
            difficulty: {
                type: String,
                enum: ['easy', 'medium', 'hard'],
                default: 'medium'
            },
            tags: [String]
        }
    ],
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
            ref: 'Flashcard',
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
flashcardSchema.index({ isPublic: 1, createdAt: -1 });

export default mongoose.model('Flashcard', flashcardSchema);