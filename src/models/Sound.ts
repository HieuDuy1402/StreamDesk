import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISound extends Document {
    id: string; // The frontend grid ID
    userId: mongoose.Types.ObjectId;
    label: string;
    icon: string;
    file?: string;
    createdAt: Date;
    updatedAt: Date;
}

const soundSchema = new Schema<ISound>({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'New Sound' },
    icon: { type: String, default: 'Music' },
    file: { type: String },
}, { timestamps: true });

// Create unique index (Frontend's ID should be unique, but typically per user. 
// However, the original structure used a global unique ID. Keeping it to prevent breaking changes,
// though `{ id: 1, userId: 1 }, { unique: true }` might be better depending on intent.)
soundSchema.index({ id: 1 }, { unique: true });
soundSchema.index({ userId: 1 }); // Index for faster user queries

// Next.js specific: Check if model exists before creating
const Sound: Model<ISound> = mongoose.models.Sound || mongoose.model<ISound>('Sound', soundSchema);

export default Sound;
