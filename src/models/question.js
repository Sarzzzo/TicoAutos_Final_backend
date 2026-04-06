const mongoose = require("mongoose");
//
const questionSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
  },
  { timestamps: true },
);


module.exports = mongoose.model("Question", questionSchema);
