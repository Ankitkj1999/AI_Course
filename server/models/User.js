import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        unique: true, 
        required: true 
    },
    mName: String,
    password: String,
    type: String,
    isAdmin: { 
        type: Boolean, 
        default: false 
    },
    resetPasswordToken: { 
        type: String, 
        default: null 
    },
    resetPasswordExpires: { 
        type: Date, 
        default: null 
    }
});

export default mongoose.model('User', userSchema);