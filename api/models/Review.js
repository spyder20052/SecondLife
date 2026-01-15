import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    productTitle: { type: String },

    reviewerId: { type: String, required: true, index: true },
    reviewerName: { type: String },

    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Review', ReviewSchema);
