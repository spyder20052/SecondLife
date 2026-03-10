import express from 'express';
import Waitlist from '../models/Waitlist.js';

const router = express.Router();

// POST /api/waitlist — Register a new waitlist entry
router.post('/', async (req, res) => {
    try {
        const { name, email, city } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Le nom et l\'email sont obligatoires.' });
        }

        // Check if email already exists
        const existing = await Waitlist.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Cet email est déjà inscrit sur la waitlist !' });
        }

        const entry = new Waitlist({ name, email, city });
        await entry.save();

        // Return total count
        const count = await Waitlist.countDocuments();
        res.status(201).json({ message: 'Inscription réussie !', count });
    } catch (err) {
        console.error('Waitlist error:', err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Cet email est déjà inscrit.' });
        }
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// GET /api/waitlist/count — Get the number of waitlist entries
router.get('/count', async (req, res) => {
    try {
        const count = await Waitlist.countDocuments();
        res.json({ count });
    } catch (err) {
        console.error('Waitlist count error:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// GET /api/waitlist/all — Get all waitlist entries (for hidden admin)
router.get('/all', async (req, res) => {
    try {
        const entries = await Waitlist.find().sort({ createdAt: -1 });
        const count = entries.length;
        res.json({ entries, count });
    } catch (err) {
        console.error('Waitlist all error:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

export default router;
