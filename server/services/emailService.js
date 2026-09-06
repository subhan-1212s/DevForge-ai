/**
 * Brevo Email dispatch service for DevForge AI
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'info@devforge.ai';

exports.sendEmail = async ({ to, subject, htmlContent }) => {
  if (!BREVO_API_KEY) {
    console.warn('Brevo API key is not configured. Skipping email dispatch.');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'DevForge AI Workspace', email: SENDER_EMAIL },
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        subject,
        htmlContent
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Email dispatched successfully via Brevo:', data.messageId);
      return data;
    }
    throw new Error(data.message || 'Brevo SMTP dispatch error');
  } catch (error) {
    console.error('Brevo Email Service Error:', error.message);
  }
};
