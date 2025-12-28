import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    phone: Number,
    msg: String,
    date: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model('Contact', contactSchema);