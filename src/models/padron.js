const mongoose = require('mongoose');

// Define the schema for the Padrón Electoral database
const PadronSchema = new mongoose.Schema({
    CEDULA: { 
        type: Number, 
        required: true, 
        unique: true,
        index: true 
    },
    NOMBRE: String,
    PAPELLIDO: String,
    SAPELLIDO: String,
    SEXO: Number,
    FECHACADUC: Number,
    CODELEC: Number,
    JUNTA: Number
}, { 
    collection: 'padron', 
    timestamps: false 
});

// Export the schema instead of a model so it can be bound to a separate connection
module.exports = PadronSchema;
