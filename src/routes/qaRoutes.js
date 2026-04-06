const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { authenticateToken } = require('../middleware/authMiddleware');

// ROUTES ===========================================================
// POST /api/qa/questions
// Private Access - Any authenticated user
router.post('/questions', authenticateToken, qaController.createQuestion);

// POST /api/qa/answers
// Private Access - Only the owner of the vehicle (verified in controller)
router.post('/answers', authenticateToken, qaController.createAnswer);
// ===================================================================

module.exports = router;
