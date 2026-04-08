const { searchByCedula } = require("../services/cedulaService");

/**
 * Controller for the Cédula API.
 */
exports.validateCedula = async (req, res) => {
    try {
        const { cedula } = req.params;
        if (!cedula || cedula.length !== 9) {
            return res.status(400).json({ message: 'Número de cédula debe ser de 9 dígitos' });
        }

        const data = await searchByCedula(cedula);
        
        if (!data) {
            return res.status(404).json({ message: 'Cédula no encontrada en el sistema local' });
        }

        res.json({
            nombre: data.nombre,
            primerApellido: data.primerApellido,
            segundoApellido: data.segundoApellido,
            sexo: data.sexo,
            esMayor: true // Padron only contains adults
        });
    } catch (error) {
        console.error('Error in validateCedula API:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
