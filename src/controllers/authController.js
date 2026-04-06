const User = require("../models/user");

// the encryption library
const bycryptjs = require("bcryptjs");

// the json web token library, or the 'jwt' library
const jwt = require("jsonwebtoken");



// ====================================================================================
// BUSINESS LOGIC TO REGISTER A NEW USER
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body; // role may come from client, optional

        // basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }

        // 1. Check if the user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash the password correctly
        const salt = await bycryptjs.genSalt(10); // generate a proper salt
        const passwordHash = await bycryptjs.hash(password, salt);

        // 3. Create the user
        const newUser = new User({
            username,
            email,
            passwordHash,
            role: role || 'buyer' // default to buyer if none provided
        });

        // 4. Save the user
        await newUser.save();

        // Results, if everything goes well
        return res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        // Results, if something goes wrong
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
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

        // We return the response
        return res.status(200).json({
            token: generatedToken,
            role: user.role
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

