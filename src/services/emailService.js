const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

// Set SendGrid API Key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an activation email to a new user.
 * @param {string} email - Recipient email address.
 * @param {string} token - Unique activation token.
 */
const sendActivationEmail = async (email, token) => {
    const activationUrl = `http://localhost:3000/api/auth/activate/${token}`;
    
    const msg = {
        to: email,
        from: process.env.EMAIL_FROM, // Use the verified sender in SendGrid
        subject: 'Activa tu cuenta en TicoAutos',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #3b82f6; text-align: center;">¡Bienvenido a TicoAutos!</h2>
                <p>Gracias por registrarte. Para completar tu registro y activar tu cuenta, por favor haz clic en el siguiente botón:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${activationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activar mi Cuenta</a>
                </div>
                <p style="font-size: 0.9em; color: #666;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                <p style="font-size: 0.8em; color: #3b82f6;">${activationUrl}</p>
                <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 0.8em; color: #999; text-align: center;">Este es un correo automático, por favor no respondas a él.</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`Activation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending SendGrid email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        throw new Error('No se pudo enviar el correo de activación');
    }
};

module.exports = { sendActivationEmail };
