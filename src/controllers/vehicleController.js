const Vehicle = require('../models/vehicle');

// CREATE VEHICLE (con imagen opcional)
// El precio debe estar en colones costarricenses (CRC)
exports.createVehicle = async (req, res) => {
    try {
        const { brand, model, year, price, description } = req.body;

        const vehicleData = {
            ownerId: req.user.id,
            brand,
            model,
            year,
            price,
            description
        };

        if (req.file) {
            vehicleData.image = '/uploads/' + req.file.filename;
        }

        const newVehicle = new Vehicle(vehicleData);
        const vehicle = await newVehicle.save();
        res.status(201).json(vehicle);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al publicar el vehiculo.' });
    }
};

// GET ALL VEHICLES (Public, with ALL filters and pagination)
// Supports: brand, model, minYear, maxYear, minPrice, maxPrice, status, search (general)
exports.getVehicles = async (req, res) => {
    try {
        const { brand, model, minYear, maxYear, minPrice, maxPrice, status, search, page = 1, limit = 10 } = req.query;

        let query = {};

        // General search (searches brand and model)
        if (search) {
            query.$or = [
                { brand: new RegExp(search, 'i') },
                { model: new RegExp(search, 'i') }
            ];
        }

        // Specific filters (override general search if provided)
        if (brand) query.brand = new RegExp(brand, 'i');
        if (model) query.model = new RegExp(model, 'i');
        if (status) query.status = status;

        // Year range
        if (minYear || maxYear) {
            query.year = {};
            if (minYear) query.year.$gte = Number(minYear);
            if (maxYear) query.year.$lte = Number(maxYear);
        }

        // Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const skip = (page - 1) * limit;

        const vehicles = await Vehicle.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Vehicle.countDocuments(query);

        res.json({
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: vehicles
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los vehiculos.' });
    }
};

// GET SINGLE VEHICLE BY ID
exports.getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findById(id)
            .populate('ownerId', 'username email')
            .populate({
                path: 'questions',
                populate: [
                    { path: 'authorId', select: 'username' },
                    {
                        path: 'answerId',
                        populate: { path: 'authorId', select: 'username' }
                    }
                ]
            });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehiculo no encontrado' });
        }

        res.json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle details:', error);
        res.status(500).json({ error: 'Error al obtener los detalles del vehiculo.' });
    }
};

// MARK VEHICLE AS SOLD (only the owner can do this)
exports.markAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehiculo no encontrado' });
        }

        // Verify ownership
        if (vehicle.ownerId.toString() !== userId) {
            return res.status(403).json({ message: 'Solo el dueno del vehiculo puede marcarlo como vendido' });
        }

        if (vehicle.status === 'sold') {
            return res.status(400).json({ message: 'Este vehiculo ya esta marcado como vendido' });
        }

        vehicle.status = 'sold';
        await vehicle.save();

        res.json({ message: 'Vehiculo marcado como vendido', vehicle });
    } catch (error) {
        console.error('Error marking vehicle as sold:', error);
        res.status(500).json({ error: 'Error al actualizar el estado del vehiculo.' });
    }
};
