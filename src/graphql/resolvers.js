const User = require('../models/user');
const Vehicle = require('../models/vehicle');

const resolvers = {
    Query: {
        // Fetch all active vehicles
        vehicles: async () => {
            try {
                return await Vehicle.find({ status: 'Active' }).populate('ownerId');
            } catch (error) {
                console.error('Error fetching vehicles via GraphQL:', error);
                throw new Error('No se pudieron obtener los vehículos');
            }
        },

        // Fetch a single vehicle
        vehicle: async (_, { id }) => {
            try {
                return await Vehicle.findById(id).populate('ownerId');
            } catch (error) {
                console.error('Error fetching vehicle via GraphQL:', error);
                throw new Error('Vehículo no encontrado');
            }
        },

        // Fetch the current user (if authenticated)
        me: async (_, __, context) => {
            if (!context.user) {
                throw new Error('No estás autenticado');
            }
            try {
                return await User.findById(context.user.id);
            } catch (error) {
                console.error('Error fetching "me" via GraphQL:', error);
                throw new Error('Error al obtener perfil');
            }
        }
    },

    // Handle mapping of ownerId to User type if it's just an ID
    Vehicle: {
        ownerId: async (vehicle) => {
            if (vehicle.ownerId && vehicle.ownerId.username) return vehicle.ownerId; // Already populated
            return await User.findById(vehicle.ownerId);
        }
    }
};

module.exports = resolvers;
