const express = require("express");
const router = express.Router();
const passport = require('passport');

// import the authController
const authController = require("../controllers/authController");

// ROUTES ===========================================================
// POST /api/auth/register
router.post("/register", authController.register); // register to a new user
// GET /api/auth/activate/:token
router.get("/activate/:token", authController.activateAccount);
// POST /api/auth/login
// ===================================================================
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FA);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleCallback);

// Complete Google Profile (Locked for authed users)
const { authenticateToken } = require('../middleware/authMiddleware');
router.put('/complete-google-profile', authenticateToken, authController.completeGoogleProfile);

// ===================================================================
module.exports = router;