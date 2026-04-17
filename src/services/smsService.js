const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Sends a 2FA verification code via SMS.
 * @param {string} phoneNumber - Recipient phone number (international format).
 * @param {string} code - The 6-digit code to send.
 */
const sendSMSCode = async (phoneNumber, code) => {
    try {
        const message = await client.messages.create({
            body: `Tu código de verificación para TicoAutos es: ${code}. Válido por 5 minutos.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        console.log(`SMS sent to ${phoneNumber}. SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error('Error sending Twilio SMS:', error);
        throw new Error('No se pudo enviar el mensaje de texto de verificación');
    }
};

module.exports = { sendSMSCode };
