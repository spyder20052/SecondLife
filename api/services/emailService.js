import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env if not already loaded (safe to do multiple times)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generic Send Function
export const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ Email credentials missing in .env. Skipping email sending.");
        return;
    }

    const mailOptions = {
        from: `"SecondLife Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("📧 Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

// 1. Welcome Email (Registration)
export const sendWelcomeEmail = async (user) => {
    const subject = "Bienvenue sur SecondLife ! 🎉";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4f46e5;">Bienvenue, ${user.displayName} !</h1>
            <p>Nous sommes ravis de vous compter parmi nous sur <strong>SecondLife</strong>.</p>
            <p>Vous pouvez dès maintenant :</p>
            <ul>
                <li>Vendre les objets dont vous ne vous servez plus.</li>
                <li>Dénicher des pépites à prix cassés.</li>
                <li>Discuter avec notre communauté.</li>
            </ul>
            <p style="margin-top: 30px;">À très vite,<br>L'équipe SecondLife</p>
        </div>
    `;
    await sendEmail(user.email, subject, html);
};

// 2. New Message Notification
export const sendMessageNotification = async (toEmail, fromName, messageContent, productTitle) => {
    const subject = `Nouveau message de ${fromName} concernant "${productTitle}"`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Vous avez reçu un message !</h2>
            <p><strong>${fromName}</strong> vous a écrit à propos de <strong>${productTitle}</strong> :</p>
            <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #4f46e5; border-radius: 4px;">
                ${messageContent}
            </blockquote>
            <p>Connectez-vous vite pour répondre !</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/messages" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir le message</a>
            </div>
        </div>
    `;
    await sendEmail(toEmail, subject, html);
};

// 3. Follow-up / Relance (Example)
export const sendFollowUpEmail = async (toEmail, userName) => {
    const subject = "Des nouveautés vous attendent sur SecondLife ! 👀";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h3>Coucou ${userName},</h3>
            <p>Cela fait un petit moment qu'on ne vous a pas vu.</p>
            <p>De nouvelles pépites ont été mises en ligne près de chez vous. Venez jeter un coup d'œil !</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/discover" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Découvrir les nouveautés</a>
            </div>
        </div>
    `;
    await sendEmail(toEmail, subject, html);
};
