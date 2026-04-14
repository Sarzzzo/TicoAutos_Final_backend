const User = require("../models/user");

// the encryption library
const bycryptjs = require("bcryptjs");

// the json web token library, or the 'jwt' library
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendActivationEmail } = require("../services/emailService");
const { sendSMSCode } = require("../services/smsService");



// ====================================================================================
// BUSINESS LOGIC TO REGISTER A NEW USER
exports.register = async (req, res) => {
    try {
        const { username, email, password, role, cedula, phoneNumber } = req.body;

        // basic validation
        if (!username || !email || !password || !cedula || !phoneNumber) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios, incluyendo teléfono y cédula' });
        }

        // 1. Check if the user already exists (including cedula)
        const existingUser = await User.findOne({ $or: [{ email }, { username }, { cedula }] });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario, correo o cédula ya están registrados' });
        }

        // 2. Validate Cedula with external API
        const cedulaData = await fetchCedulaData(cedula);
        
        // If API fails, we still allow registration but require names to be provided
        if (!cedulaData && (!req.body.firstName || !req.body.lastName)) {
            return res.status(400).json({ message: 'No se pudo validar la cédula automáticamente. Por favor ingresa tus datos manualmente.' });
        }

        // Fulfill requirement: age validation (only if we have API data)
        if (cedulaData && !cedulaData.esMayor) {
            return res.status(400).json({ message: `Debes ser mayor de edad para registrarte.` });
        }

        // 3. Hash the password
        const salt = await bycryptjs.genSalt(10);
        const passwordHash = await bycryptjs.hash(password, salt);

        // 4. Generate Activation Token
        const activationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            username,
            email,
            passwordHash,
            cedula,
            phoneNumber,
            firstName: req.body.firstName || (cedulaData ? cedulaData.nombre : ''),
            lastName: req.body.lastName || (cedulaData ? `${cedulaData.primerApellido} ${cedulaData.segundoApellido}` : ''),
            role: role || 'buyer',
            status: 'Pending',
            activationToken
        });

        await newUser.save();

        // 5. Send Activation Email
        try {
            await sendActivationEmail(email, activationToken);
        } catch (mailError) {
            console.error('Error sending welcome mail:', mailError);
            // We still created the user, but inform about mail failure
            return res.status(201).json({ 
                message: 'Usuario creado, pero hubo un error enviando el correo de activación. Contacta a soporte.',
                status: 'MailError'
            });
        }

        return res.status(201).json({ message: 'Registro exitoso. Por favor revisa tu correo para activar tu cuenta.' });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Endpoint to activate account via email link
exports.activateAccount = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ activationToken: token });
        if (!user) {
            return res.status(400).send('<h1>Enlace inválido o expirado</h1><p>El token de activación no es válido.</p>');
        }

        user.status = 'Active';
        user.activationToken = undefined; // Clear token after use
        await user.save();

        // Redirect to a success page or just show a message
        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #4ade80;">¡Cuenta Activada!</h1>
                <p>Tu cuenta ha sido activada con éxito. Ya puedes iniciar sesión en TicoAutos.</p>
                <a href="http://localhost:3000/index.html" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Ir al Login</a>
            </div>
        `);
    } catch (error) {
        console.error('Error activating account:', error);
        res.status(500).send('<h1>Error al activar la cuenta</h1>');
    }
};

const { searchByCedula } = require("../services/cedulaService");

// Helper function to fetch data from Local Database (Padron)
async function fetchCedulaData(cedula) {
    try {
        const data = await searchByCedula(cedula);
        
        if (data) {
            return {
                nombre: data.nombre,
                primerApellido: data.primerApellido,
                segundoApellido: data.segundoApellido,
                edad: 18, // Padrón only contains 18+ individuals
                esMayor: true
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching cedula data:', error);
        return null;
    }
}

// Endpoint for frontend to validate and autocomplete
exports.validateCedulaEndpoint = async (req, res) => {
    const { cedula } = req.params;
    const data = await fetchCedulaData(cedula);
    
    if (!data) {
        return res.status(404).json({ message: 'Cédula no encontrada' });
    }

    res.json({
        nombre: data.nombre,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido,
        edad: data.edad,
        esMayor: data.esMayor
    });
};

// ====================================================================================
// BUSINESS LOGIC TO LOGIN A USER
exports.login = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if ((!username && !email) || !password) {
            return res.status(400).json({ message: 'Username/email and password are required' });
        }

        // 1. Check if the user exists, trying both username and email
        const user = await User.findOne({ $or: [{ username }, { email }] });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 1.5 Check if user is Active
        if (user.status === 'Pending') {
            return res.status(403).json({ message: 'Tu cuenta está pendiente de activación. Por favor revisa tu correo.' });
        }

        // 2. Check password
        const isMatch = await bycryptjs.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Generate 2FA Code
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        user.twoFactorCode = code;
        user.twoFactorExpires = expires;
        await user.save();

        // 4. Send SMS
        try {
            await sendSMSCode(user.phoneNumber, code);
        } catch (smsError) {
            console.error('SMS Error:', smsError);
            // Consider allowing fail-safe or just error out
            return res.status(500).json({ message: 'Error enviando el código de seguridad. Inténtalo más tarde.' });
        }

        return res.status(200).json({
            message: 'Código de verificación enviado',
            require2FA: true,
            userId: user._id
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Verify the SMS code and return final JWT
exports.verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) return res.status(400).json({ message: 'ID de usuario y código son requeridos' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Check code and expiration
        if (!user.twoFactorCode || user.twoFactorCode !== code || user.twoFactorExpires < Date.now()) {
            return res.status(401).json({ message: 'Código incorrecto o expirado' });
        }

        // Success: Clear 2FA fields
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        await user.save();

        // Generate final token
        const payload = {
            user: {
                id: user._id,
                role: user.role,
            }
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' });

        res.json({
            token,
            role: user.role
        });
    } catch (error) {
        console.error('Error in verify2FA:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Google OAuth Callback Handler
exports.googleCallback = async (req, res) => {
    try {
        const user = req.user;
        const payload = {
            user: {
                id: user._id,
                role: user.role,
            }
        };
        const generatedToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' });

        // Redirect to frontend with token and status
        // The frontend will handle the 'Pending' status by asking for the cedula
        res.redirect(`http://localhost:3000/index.html?token=${generatedToken}&status=${user.status}`);
    } catch (error) {
        console.error('Error in googleCallback:', error);
        res.redirect('http://localhost:3000/index.html?error=google_auth_failed');
    }
};

// Complete Profile for Google Users
exports.completeGoogleProfile = async (req, res) => {
    try {
        const { cedula, firstName, lastName, phoneNumber } = req.body;
        const userId = req.user.id;

        if (!cedula || !phoneNumber) return res.status(400).json({ message: 'Cedula and Phone Number are required' });

        // Validate Cedula - Optional fallback
        const cedulaData = await fetchCedulaData(cedula);
        
        // If API fails, we might still allow it if we had names, but Google users usually just provide cedula here.
        // For simplicity, we'll allow it but use placeholders if we can't find names and none were provided.
        // Actually, let's keep it consistent: if API fails, they need to provide names (or we use existing ones).
        
        // Check if cedula already exists
        const existing = await User.findOne({ cedula });
        if (existing) return res.status(400).json({ message: 'Esta cedula ya esta registrada' });

        const updateData = {
            cedula,
            phoneNumber,
            status: 'Active'
        };

        if (cedulaData) {
            updateData.firstName = cedulaData.nombre;
            updateData.lastName = `${cedulaData.primerApellido} ${cedulaData.segundoApellido}`;
        } else if (req.body.firstName && req.body.lastName) {
            updateData.firstName = req.body.firstName;
            updateData.lastName = req.body.lastName;
        } else {
            return res.status(400).json({ message: 'No se pudo validar la cédula automáticamente. Por favor ingresa tus datos manualmente.' });
        }

        await User.findByIdAndUpdate(userId, updateData);

        res.json({ message: 'Perfil completado con exito' });
    } catch (error) {
        console.error('Error completing profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

