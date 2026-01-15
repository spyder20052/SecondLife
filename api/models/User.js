import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    displayName: { type: String },
    photoURL: { type: String },
    city: { type: String, default: '' },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
