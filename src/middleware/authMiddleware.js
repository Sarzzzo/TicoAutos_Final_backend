// Middleware to protect routes - only authenticated users can access them
const jwt = require("jsonwebtoken");

const authenticateToken = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // Use process.env directly - dotenv is already loaded in index.js
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
