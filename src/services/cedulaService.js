const mongoose = require('mongoose');
const PadronSchema = require('../models/padron');
const dotenv = require('dotenv');

dotenv.config();

// Create a separate connection for the Padrón database
// We derive the URL from the main DATABASE_URL but point to 'padron_electoral'
const padronDbUrl = process.env.DATABASE_URL.includes('TicoAutos_FinalVers') 
    ? process.env.DATABASE_URL.replace('TicoAutos_FinalVers', 'padron_electoral')
    : process.env.DATABASE_URL; // Fallback if name is different

const padronConn = mongoose.createConnection(padronDbUrl);
const Padron = padronConn.model('Padron', PadronSchema);

/**
 * Service to search for a Cédula in the local Padrón Electoral database.
 */
async function searchByCedula(cedula) {
    try {
        const cedulaNum = parseInt(cedula);
        if (isNaN(cedulaNum)) return null;

        const info = await Padron.findOne({ CEDULA: cedulaNum });
        if (!info) return null;

        return {
            nombre: info.NOMBRE,
            primerApellido: info.PAPELLIDO,
            segundoApellido: info.SAPELLIDO,
            sexo: info.SEXO === 1 ? 'Masculino' : 'Femenino',
            vencimiento: info.FECHACADUC
        };
    } catch (error) {
        console.error('Error in local cedula search:', error);
        return null;
    }
}

module.exports = { searchByCedula };
