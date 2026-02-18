const mongoose = require('mongoose');

const soundSchema = new mongoose.Schema({
    id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: 'New Sound' },
    icon: { type: String, default: 'Music' },
    file: { type: String },
}, { timestamps: true });

// Create unique index
soundSchema.index({ id: 1 }, { unique: true });
soundSchema.index({ userId: 1 }); // Index for faster user queries

module.exports = mongoose.model('Sound', soundSchema);
