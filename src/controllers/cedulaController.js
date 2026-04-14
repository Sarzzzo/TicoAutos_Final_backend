const { searchByCedula } = require("../services/cedulaService");

/**
 * Controller for the Cédula API.
 */
exports.validateCedula = async (req, res) => {
    try {
        let { cedula } = req.params;
        
        // Remove any dashes or spaces
        cedula = cedula.replace(/\D/g, '');

        if (!cedula || cedula.length < 7 || cedula.length > 12) {
            return res.status(400).json({ message: 'Número de cédula inválido (formato incorrecto)' });
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
