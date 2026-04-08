const express = require("express");
const router = express.Router();
const cedulaController = require("../controllers/cedulaController");

/**
 * Route for the local Cédula API.
 */
router.get("/validate/:cedula", cedulaController.validateCedula);

module.exports = router;
