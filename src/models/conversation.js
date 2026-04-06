const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
    {
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messages: [messageSchema],
    },
    { timestamps: true }
);

// Ensure only one conversation per buyer per vehicle
conversationSchema.index({ vehicleId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
