import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials missing. Skipping.');
        return;
    }
    const mailOptions = {
        from: `"SecondLife Support" <${process.env.EMAIL_USER}>`,
        to, subject, html
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
};

export const sendWelcomeEmail = async (user) => {
    const subject = 'Bienvenue sur SecondLife !';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4f46e5;">Bienvenue, ${user.displayName} !</h1>
            <p>Nous sommes ravis de vous compter parmi nous sur <strong>SecondLife</strong>.</p>
            <ul>
                <li>Vendez les objets dont vous ne vous servez plus.</li>
                <li>Dénicher des pépites à prix cassés.</li>
                <li>Discuter avec notre communauté.</li>
            </ul>
            <p style="margin-top: 30px;">À très vite,<br>L'équipe SecondLife</p>
        </div>
    `;
    await sendEmail(user.email, subject, html);
};

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
                <a href="${process.env.APP_URL || 'https://sacond-life-mvp.vercel.app'}/messages"
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                   Voir le message
                </a>
            </div>
        </div>
    `;
    await sendEmail(toEmail, subject, html);
};
