const mongoose = require('mongoose');

// Define the schema for the Padrón Electoral database
// The fields correspond to the Costa Rican Electoral Roll format
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
    collection: 'padron', // Explicitly point to the padron collection
    timestamps: false 
});

module.exports = mongoose.model('Padron', PadronSchema);
