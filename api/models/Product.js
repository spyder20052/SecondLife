import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    category: { type: String, default: 'Autres' },
    city: { type: String },
    images: [{ type: String }],
    imageUrl: { type: String }, // Main thumbnail
    updatedAt: { type: Date },

    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String },
    sellerAvatar: { type: String },

    status: { type: String, enum: ['active', 'sold', 'hidden'], default: 'active' },
    buyerId: { type: String },

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', ProductSchema);
