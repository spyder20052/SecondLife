import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendMessageNotification } from '../services/emailService.js';

const router = express.Router();

// Send Message
router.post('/', async (req, res) => {
    const newMessage = new Message(req.body);
    try {
        const savedMessage = await newMessage.save();
        (async () => {
            try {
                const { senderId, buyerId, sellerId, productTitle, buyerName, sellerName, content } = req.body;
                const recipientId = senderId === buyerId ? sellerId : buyerId;
                const senderName = senderId === buyerId ? buyerName : sellerName;
                const recipient = await User.findOne({ uid: recipientId });
                if (recipient?.email) {
                    await sendMessageNotification(recipient.email, senderName, content || 'Image envoyée', productTitle);
                }
            } catch (e) { console.error('Failed to send message email notification', e); }
        })();
        res.status(200).json({ ...savedMessage._doc, id: savedMessage._id });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Specific Conversation
router.get('/conversation', async (req, res) => {
    const { productId, buyerId, sellerId } = req.query;
    try {
        const messages = await Message.find({ productId, buyerId, sellerId }).sort({ timestamp: 1 });
        res.status(200).json(messages.map(m => ({ ...m._doc, id: m._id })));
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Messages for a User
router.get('/:userId', async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ buyerId: req.params.userId }, { sellerId: req.params.userId }]
        }).sort({ timestamp: -1 });
        res.status(200).json(messages.map(m => ({ ...m._doc, id: m._id })));
    } catch (err) {
        res.status(500).json(err);
    }
});

// Mark as read
router.put('/read/:messageId', async (req, res) => {
    try {
        const { userId } = req.body;
        await Message.findByIdAndUpdate(req.params.messageId, { $addToSet: { readBy: userId } });
        res.status(200).json('Updated');
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
