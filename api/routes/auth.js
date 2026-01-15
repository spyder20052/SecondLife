import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeinprod';

import { sendEmail, sendWelcomeEmail } from '../services/emailService.js';

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, city, photoURL } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const uid = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);

        const newUser = new User({
            uid,
            email,
            password: hashedPassword,
            displayName: displayName || email.split('@')[0],
            city: city || '',
            photoURL: photoURL || null,
            isOnline: true
        });

        const savedUser = await newUser.save();

        // Send Welcome Email
        sendWelcomeEmail(savedUser).catch(e => console.error("Welcome email failed", e));

        const token = jwt.sign({ id: savedUser._id, uid: savedUser.uid }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ token, user: savedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email introuvable." });

        // Generate Token
        // Simple random token
        const token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send Email
        const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/auth?resetToken=${token}`;

        const subject = "Réinitialisation de votre mot de passe - SecondLife";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Mot de passe oublié ?</h2>
                <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                <p>Ce lien est valide pendant 1 heure.</p>
                <p style="color: #666; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            </div>
        `;

        await sendEmail(email, subject, html);

        res.status(200).json({ message: "Email envoyé" });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Lien invalide ou expiré." });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Mot de passe modifié avec succès !" });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Select password because it's hidden by default
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, uid: user.uid }, JWT_SECRET, { expiresIn: '30d' });

        // Return user without password
        const { password: _, ...userData } = user._doc;
        res.status(200).json({ token, user: userData });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ME (Verify Token & Get Data)
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

export default router;
