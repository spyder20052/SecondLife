// EmailJS Configuration
// Get your credentials from https://www.emailjs.com/
// 1. Create account -> Email Services -> Add Service (Gmail/Outlook)
// 2. Email Templates -> Create New Template
// 3. Account -> API Keys -> Copy Public Key

export const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_mbyba6t',      // Replace with your EmailJS Service ID
    TEMPLATE_ID: 'template_v9e1adh',    // Replace with your EmailJS Template ID
    PUBLIC_KEY: 'ijknwo-iSK1lYmOlz',      // Replace with your EmailJS Public Key

    // Set to true once you've configured EmailJS
    ENABLED: true
};

/*
Template Variables to use in EmailJS dashboard:
- {{to_email}} - Recipient's email address
- {{to_name}} - Recipient's name
- {{from_name}} - Sender's name
- {{message}} - Message content
- {{product_title}} - Product being discussed
- {{app_url}} - Link to the app

Example template:
---
Subject: Nouveau message de {{from_name}} sur Second Life

Bonjour {{to_name}},

Vous avez reçu un nouveau message de {{from_name}} concernant "{{product_title}}":

"{{message}}"

Connectez-vous pour répondre: {{app_url}}

L'équipe Second Life
---
*/
