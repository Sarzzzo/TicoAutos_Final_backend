const Conversation = require('../models/conversation');
const Vehicle = require('../models/vehicle');

// START or GET a conversation for a vehicle
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const buyerId = req.user.id;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehiculo no encontrado' });
        }

        // Owner cannot start a conversation with themselves
        if (vehicle.ownerId.toString() === buyerId) {
            return res.status(400).json({ message: 'No puedes enviarte mensajes a ti mismo' });
        }

        // Find existing or create new conversation
        let conversation = await Conversation.findOne({ vehicleId, buyerId })
            .populate('buyerId', 'username')
            .populate('sellerId', 'username')
            .populate('vehicleId', 'brand model year image')
            .populate('messages.senderId', 'username');

        if (!conversation) {
            conversation = new Conversation({
                vehicleId,
                buyerId,
                sellerId: vehicle.ownerId,
                messages: []
            });
            await conversation.save();
            conversation = await Conversation.findById(conversation._id)
                .populate('buyerId', 'username')
                .populate('sellerId', 'username')
                .populate('vehicleId', 'brand model year image')
                .populate('messages.senderId', 'username');
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// SEND a message in a conversation (alternating turns)
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversacion no encontrada' });
        }

        // Verify the sender is part of this conversation
        const isBuyer = conversation.buyerId.toString() === senderId;
        const isSeller = conversation.sellerId.toString() === senderId;
        if (!isBuyer && !isSeller) {
            return res.status(403).json({ message: 'No tienes acceso a esta conversacion' });
        }

        // Enforce alternating: can only send if last message isn't yours
        if (conversation.messages.length > 0) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            if (lastMessage.senderId.toString() === senderId) {
                return res.status(400).json({ message: 'Debes esperar a que la otra persona responda antes de enviar otro mensaje' });
            }
        }

        conversation.messages.push({ senderId, content });
        await conversation.save();

        // Return populated conversation
        const updated = await Conversation.findById(conversationId)
            .populate('buyerId', 'username')
            .populate('sellerId', 'username')
            .populate('vehicleId', 'brand model year image')
            .populate('messages.senderId', 'username');

        res.status(201).json(updated);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// GET all conversations for the current user
exports.getMyConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            $or: [{ buyerId: userId }, { sellerId: userId }]
        })
            .populate('buyerId', 'username')
            .populate('sellerId', 'username')
            .populate('vehicleId', 'brand model year image')
            .populate('messages.senderId', 'username')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
