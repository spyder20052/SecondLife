import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const newReview = new Review(req.body);
    try {
        const savedReview = await newReview.save();
        const sellerId = req.body.sellerId;
        const stats = await Review.aggregate([
            { $match: { sellerId } },
            { $group: { _id: '$sellerId', total: { $sum: 1 }, avg: { $avg: '$rating' } } }
        ]);
        if (stats.length > 0) {
            await User.findOneAndUpdate(
                { uid: sellerId },
                { $set: { ratingCount: stats[0].total, ratingSum: stats[0].avg * stats[0].total } }
            );
        }
        res.status(200).json(savedReview);
    } catch (err) { res.status(500).json(err); }
});

router.get('/seller/:sellerId', async (req, res) => {
    try {
        const reviews = await Review.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (err) { res.status(500).json(err); }
});

router.get('/check', async (req, res) => {
    const { productId, buyerId } = req.query;
    try {
        const review = await Review.findOne({ productId, reviewerId: buyerId });
        res.status(200).json({ exists: !!review });
    } catch (err) { res.status(500).json(err); }
});

export default router;
