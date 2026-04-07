const User = require("../models/user");

// the encryption library
const bycryptjs = require("bcryptjs");

// the json web token library, or the 'jwt' library
const jwt = require("jsonwebtoken");



// ====================================================================================
// BUSINESS LOGIC TO REGISTER A NEW USER
exports.register = async (req, res) => {
    try {
        const { username, email, password, role, cedula } = req.body;

        // basic validation
        if (!username || !email || !password || !cedula) {
            return res.status(400).json({ message: 'Username, email, password and cedula are required' });
        }

        // 1. Check if the user already exists (including cedula)
        const existingUser = await User.findOne({ $or: [{ email }, { username }, { cedula }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this username, email or cedula already exists' });
        }

        // 2. Validate Cedula with external API
        const cedulaData = await fetchCedulaData(cedula);
        
        // If API fails, we still allow registration but require names to be provided
        if (!cedulaData && (!req.body.firstName || !req.body.lastName)) {
            return res.status(400).json({ message: 'No se pudo validar la cédula automáticamente. Por favor ingresa tus datos manualmente.' });
        }

        // Fulfill requirement: age validation (only if we have API data)
        if (cedulaData && !cedulaData.esMayor) {
            return res.status(400).json({ message: `Debes ser mayor de edad para registrarte. Edad actual: ${cedulaData.edad} años.` });
        }

        // 3. Hash the password
        const salt = await bycryptjs.genSalt(10);
        const passwordHash = await bycryptjs.hash(password, salt);

        // 4. Create the user
        const newUser = new User({
            username,
            email,
            passwordHash,
            cedula,
            firstName: req.body.firstName || cedulaData.nombre,
            lastName: req.body.lastName || `${cedulaData.primerApellido} ${cedulaData.segundoApellido}`,
            role: role || 'buyer'
        });

        await newUser.save();
        return res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper function to fetch data from Hacienda API
async function fetchCedulaData(cedula) {
    try {
        const response = await fetch(`https://registrocivil.uca.ac.cr/api/consulta_cedula/${cedula}`);
        if (!response.ok) return null;
        const data = await response.json();
        
        if (data && data.nombre) {
            // Calculate age from fecha_suceso (YYYYMMDD)
            const birthStr = data.fecha_suceso;
            if (!birthStr || birthStr.length !== 8) return null;

            const year = parseInt(birthStr.substring(0, 4));
            const month = parseInt(birthStr.substring(4, 6)) - 1;
            const day = parseInt(birthStr.substring(6, 8));
            const birthDate = new Date(year, month, day);
            const today = new Date();
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return {
                nombre: data.nombre,
                primerApellido: data.primer_apellido,
                segundoApellido: data.segundo_apellido,
                edad: age,
                esMayor: age >= 18
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
            return res.status(401).json({ message: 'Credentials not valid' });
        }

        // 2. Check password
        const isMatch = await bycryptjs.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credentials not valid' });
        }

        // 3. Generate a token
        const payload = {
            user: {
                id: user._id,
                role: user.role,
            }
        };

        // 3. Generate the JWT Token
        const secretKey = process.env.JWT_SECRET;
        const tokenConfig = { expiresIn: '10h' };

        // We create the token synchronously
        const generatedToken = jwt.sign(payload, secretKey, tokenConfig);

        return res.status(200).json({
            token: generatedToken,
            role: user.role
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'Internal server error' });
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
        const { cedula } = req.body;
        const userId = req.user.id;

        if (!cedula) return res.status(400).json({ message: 'Cedula is required' });

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

