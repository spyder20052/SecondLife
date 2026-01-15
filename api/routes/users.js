import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Create or Update User (Upsert)
router.post('/', async (req, res) => {
    try {
        const { uid, email } = req.body;
        const user = await User.findOneAndUpdate(
            { uid },
            { $set: req.body },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get User
router.get('/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        if (!user) return res.status(404).json("User not found");
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update User
router.put('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const updateData = req.body;

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const user = await User.findOneAndUpdate(
            { uid },
            { $set: updateData },
            { new: true }
        );

        if (!user) return res.status(404).json("User not found");
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
