import mongoose from 'mongoose';

const documentProcessingSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    filename: { 
        type: String, 
        required: true 
    },
    fileType: { 
        type: String, 
        enum: ['pdf', 'docx', 'txt', 'url'], 
        required: true 
    },
    fileSize: { 
        type: Number 
    },
    url: { 
        type: String 
    }, // For URL-based extractions
    extractionStatus: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed'], 
        default: 'pending',
        index: true
    },
    extractedText: {
        type: String
    }, // Full extracted text
    extractedTextPreview: { 
        type: String, 
        maxlength: 500 
    }, // First 500 chars
    extractedTextLength: { 
        type: Number 
    },
    errorMessage: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    expiresAt: { 
        type: Date, 
        default: () => Date.now() + 3600000 
    } // 1 hour
});

// Auto-delete expired records using TTL index
documentProcessingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('DocumentProcessing', documentProcessingSchema);
