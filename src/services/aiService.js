const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Checks if a message contains contact information (phone, email, etc.) using OpenAI.
 * @param {string} text - The message content.
 * @returns {Promise<boolean>} - True if it contains contact info, false otherwise.
 */
const containsContactInfo = async (text) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Efficient and good for this task
            messages: [
                {
                    role: "system",
                    content: "Eres un moderador de chat para una plataforma de venta de autos. Tu tarea es detectar si un mensaje contiene información de contacto personal como números de teléfono, correos electrónicos o direcciones exactas. Responde únicamente con la palabra 'SÍ' si contiene información de contacto, o 'NO' si es un mensaje seguro."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            max_tokens: 5,
            temperature: 0
        });

        const result = response.choices[0].message.content.trim().toUpperCase();
        return result.includes('SÍ') || result.includes('SI');
    } catch (error) {
        if (error.status === 429) {
            console.log('\n[Moderar Chat] Aviso: Límite de saldo de su cuenta OpenAI excedido (Error 429). El mensaje pasó la verificación automáticamente por contingencia.');
        } else {
            console.error('\n[Moderar Chat] Error de OpenAI:', error.message);
        }
        // Fallback: If AI fails, we allow the message to not block the user experience,
        // or we could use a regex fallback.
        return false;
    }
};

module.exports = { containsContactInfo };
