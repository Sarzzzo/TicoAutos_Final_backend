const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String }, // Optional for Google OAuth users
    firstName: { type: String },
    lastName: { type: String },
    cedula: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ["Pending", "Active"], default: "Active" }, // Defaulting to Active for now as per partial req
    role: { type: String, enum: ["owner", "buyer"], default: "buyer" },
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
