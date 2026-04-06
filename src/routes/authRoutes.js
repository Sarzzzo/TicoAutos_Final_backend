const express = require("express");
const router = express.Router();

// import the authController
const authController = require("../controllers/authController");

// ROUTES ===========================================================
// POST /api/auth/register
router.post("/register", authController.register); // register to a new user
// POST /api/auth/login
// ===================================================================
router.post('/login', authController.login);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleCallback);

// Complete Google Profile (Locked for authed users)
const { verifyToken } = require('../middleware/auth');
router.put('/complete-google-profile', verifyToken, authController.completeGoogleProfile);

// Public route to validate ID (costa rica)
router.get('/validate-cedula/:cedula', authController.validateCedulaEndpoint);

// ===================================================================
module.exports = router;