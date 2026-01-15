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
    if (!EMAILJS_CONFIG.ENABLED || !toEmail) return { success: false, reason: 'disabled_or_no_email' };

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
        console.log('[EmailJS] Message Email Sent');
        return { success: true, result };
    } catch (error) {
        console.error('[EmailJS] Failed:', error);
        return { success: false, error };
    }
};

/**
 * Send invitation to review the seller
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email (Buyer)
 * @param {string} params.toName - Recipient name (Buyer)
 * @param {string} params.sellerName - Name of the seller
 * @param {string} params.productTitle - Title of the product purchased
 */
export const sendReviewInvitationEmail = async ({ toEmail, toName, sellerName, productTitle }) => {
    if (!EMAILJS_CONFIG.ENABLED || !toEmail) return { success: false, reason: 'disabled_or_no_email' };

    try {
        const result = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            {
                to_email: toEmail,
                to_name: toName || 'Acheteur',
                from_name: 'Second Life',
                message: `Merci pour votre achat de "${productTitle}" ! N'oubliez pas de laisser un avis à ${sellerName} pour aider la communauté.`,
                product_title: 'Invitation à laisser un avis',
                app_url: 'https://second-life-mvp.vercel.app/'
            }
        );
        console.log('[EmailJS] Review Invitation Sent');
        return { success: true, result };
    } catch (error) {
        console.error('[EmailJS] Failed:', error);
        return { success: false, error };
    }
};/**
 * Send reminder email for unread messages
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient name
 * @param {number} params.unreadCount - Number of unread messages
 */
export const sendUnreadReminderEmail = async ({ toEmail, toName, unreadCount }) => {
    if (!EMAILJS_CONFIG.ENABLED || !toEmail) return { success: false, reason: 'disabled_or_no_email' };
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
        console.error('[EmailJS] Reminder Failed:', error);
        return { success: false, error };
    }
};
