const express = require("express");
const router = express.Router();

// import the authController
const authController = require("../controllers/authController");

// ROUTES ===========================================================
// POST /api/auth/register
router.post("/register", authController.register); // register to a new user
// POST /api/auth/login
// ===================================================================
router.post("/login", authController.login); // login to a user
// ===================================================================
module.exports = router;