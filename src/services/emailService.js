import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../emailConfig';

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

/**
 * Send email notification for new message
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient name
 * @param {string} params.fromName - Sender name
 * @param {string} params.message - Message content
 * @param {string} params.productTitle - Product title
 */
export const sendMessageNotificationEmail = async ({ toEmail, toName, fromName, message, productTitle }) => {
    // Skip if EmailJS is not configured
    if (!EMAILJS_CONFIG.ENABLED) {
        console.log('[EmailJS] Disabled - skipping email notification');
        return { success: false, reason: 'disabled' };
    }

    // Skip if no email provided
    if (!toEmail) {
        console.log('[EmailJS] No recipient email provided');
        return { success: false, reason: 'no_email' };
    }

    try {
        const result = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            {
                to_email: toEmail,
                to_name: toName || 'Utilisateur',
                from_name: fromName || 'Un utilisateur',
                message: message || 'Nouveau message',
                product_title: productTitle || 'Article',
                app_url: 'https://second-life-mvp.vercel.app/'
            }
        );

        console.log('[EmailJS] Email sent successfully:', result.text);
        return { success: true, result };
    } catch (error) {
        console.error('[EmailJS] Failed to send email:', error);
        return { success: false, error };
    }
};

/**
 * Send reminder email for unread messages
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient name
 * @param {number} params.unreadCount - Number of unread messages
 */
export const sendUnreadReminderEmail = async ({ toEmail, toName, unreadCount }) => {
    if (!EMAILJS_CONFIG.ENABLED || !toEmail) {
        return { success: false, reason: 'disabled_or_no_email' };
    }

    try {
        const result = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            {
                to_email: toEmail,
                to_name: toName || 'Utilisateur',
                from_name: 'Second Life',
                message: `Vous avez ${unreadCount} message(s) non lu(s) en attente.`,
                product_title: 'Rappel de messages',
                app_url: 'https://second-life-mvp.vercel.app/'
            }
        );

        return { success: true, result };
    } catch (error) {
        console.error('[EmailJS] Reminder email failed:', error);
        return { success: false, error };
    }
};
