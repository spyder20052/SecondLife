import { sendEmail } from './services/emailService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🧪 Testing Email Configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');

const testEmail = async () => {
    try {
        console.log('\n📧 Sending test email...');
        await sendEmail(
            process.env.EMAIL_USER, // Send to yourself
            'Test SecondLife Email 🎉',
            '<h1>Ça marche !</h1><p>Si vous recevez ce mail, votre configuration email fonctionne parfaitement.</p>'
        );
        console.log('✅ Email sent successfully! Check your inbox.');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
    process.exit(0);
};

testEmail();
