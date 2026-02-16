import mongoose from 'mongoose';

const soundSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'New Sound' },
    icon: { type: String, default: 'Music' },
    file: { type: String }, // Now stores the Blob URL
}, { timestamps: true });

// Prevent overwriting model if already compiled
const Sound = mongoose.models.Sound || mongoose.model('Sound', soundSchema);

export default Sound;
