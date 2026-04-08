const Padron = require('../models/padron');

/**
 * Service to search for a Cédula in the local Padrón Electoral database.
 * @param {string} cedula - The 9-digit Cédula number.
 * @returns {Promise<Object|null>} - The data object if found, or null otherwise.
 */
async function searchByCedula(cedula) {
    try {
        // Convert the input string to a number for the MongoDB query
        const cedulaNum = parseInt(cedula);
        if (isNaN(cedulaNum)) return null;

        const info = await Padron.findOne({ CEDULA: cedulaNum });
        if (!info) return null;

        // Map the fields to a more user-friendly format
        return {
            nombre: info.NOMBRE,
            primerApellido: info.PAPELLIDO,
            segundoApellido: info.SAPELLIDO,
            sexo: info.SEXO === 1 ? 'Masculino' : 'Femenino',
            vencimiento: info.FECHACADUC
            // Age cannot be definitively calculated from these fields without birthDate,
            // but the Padrón Electoral only includes persons of legal age (18+).
        };
    } catch (error) {
        console.error('Error in local cedula search:', error);
        return null;
    }
}

module.exports = { searchByCedula };
