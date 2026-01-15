import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';

const router = express.Router();

// Add Review
router.post('/', async (req, res) => {
    const newReview = new Review(req.body);
    try {
        const savedReview = await newReview.save();

        // Aggregation: Update User's rating
        const sellerId = req.body.sellerId;
        // Recalculate average
        const stats = await Review.aggregate([
            { $match: { sellerId: sellerId } },
            { $group: { _id: "$sellerId", total: { $sum: 1 }, avg: { $avg: "$rating" } } }
        ]);

        if (stats.length > 0) {
            await User.findOneAndUpdate(
                { uid: sellerId },
                {
                    $set: {
                        ratingSum: stats[0].avg * stats[0].total, // storing sum/count is redundant if we store avg/total
                        // adjusting to match previous logic or just storing avg/count
                        // Let's store what the User model has: ratingSum/ratingCount
                        ratingCount: stats[0].total,
                        ratingSum: stats[0].avg * stats[0].total
                        // actually, better to just store stats directly if model allows, but let's stick to simple math
                    }
                }
            );
        }

        res.status(200).json(savedReview);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Reviews for a Seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const reviews = await Review.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Check if review exists
router.get('/check', async (req, res) => {
    const { productId, buyerId } = req.query;
    try {
        const review = await Review.findOne({ productId, reviewerId: buyerId });
        res.status(200).json({ exists: !!review });
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
