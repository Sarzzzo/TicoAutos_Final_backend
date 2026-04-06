const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET all conversations for the logged-in user
router.get('/my', authenticateToken, chatController.getMyConversations);

// GET or CREATE a conversation for a vehicle (buyer starts it)
router.get('/vehicle/:vehicleId', authenticateToken, chatController.getOrCreateConversation);

// POST a message to a conversation (alternating turns)
router.post('/:conversationId/message', authenticateToken, chatController.sendMessage);

module.exports = router;
