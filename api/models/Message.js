import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    productId: { type: String, required: true, index: true },
    productTitle: { type: String },

    senderId: { type: String, required: true },
    buyerId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },

    buyerName: { type: String },
    sellerName: { type: String },

    content: { type: String },
    type: { type: String, enum: ['text', 'image', 'payment_request', 'payment_confirmed', 'sale_confirmed'], default: 'text' },
    imageUrl: { type: String },

    readBy: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
});

MessageSchema.index({ buyerId: 1, sellerId: 1 });

export default mongoose.model('Message', MessageSchema);
