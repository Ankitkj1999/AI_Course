import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: { 
        type: String, 
        unique: true, 
        required: true 
    },
    excerpt: String,
    category: String,
    tags: String,
    content: String,
    image: {
        type: Buffer,
        required: true
    },
    popular: { 
        type: Boolean, 
        default: false 
    },
    featured: { 
        type: Boolean, 
        default: false 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model('Blog', blogSchema);