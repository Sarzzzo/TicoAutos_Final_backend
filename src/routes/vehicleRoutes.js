const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const vehicleController = require('../controllers/vehicleController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imagenes (jpg, png, webp)'));
    }
});

// PUBLIC: Get all vehicles with filters
router.get('/', vehicleController.getVehicles);

// PUBLIC: Get single vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// PRIVATE: Create a new vehicle (with optional image upload)
router.post('/', authenticateToken, upload.single('image'), vehicleController.createVehicle);

// PRIVATE: Mark vehicle as sold (owner only)
router.put('/:id/sold', authenticateToken, vehicleController.markAsSold);

module.exports = router;
