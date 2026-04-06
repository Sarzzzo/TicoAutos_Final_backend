const Question = require('../models/question');
const Answer = require('../models/answer');
const Vehicle = require('../models/vehicle');

// ====================================================================================
// BUSINESS LOGIC TO CREATE A NEW QUESTION
// Any authenticated user can ask a question about a vehicle
exports.createQuestion = async (req, res) => {
    try {
        const { vehicleId, content } = req.body;
        const authorId = req.user.id; // From the authenticated token

        // Check if vehicle exists
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }

        // Prevent owner from asking questions on their own vehicle
        if (vehicle.ownerId.toString() === authorId) {
            return res.status(400).json({ message: 'No puedes hacer preguntas en tu propio anuncio' });
        }

        // Enforce 1 question per user per vehicle
        const existingQuestion = await Question.findOne({ vehicleId, authorId });
        if (existingQuestion) {
            return res.status(400).json({ message: 'Ya hiciste una pregunta sobre este vehiculo. Solo se permite una pregunta por usuario.' });
        }

        // Create the new question
        const newQuestion = new Question({
            vehicleId,
            authorId,
            content
        });

        const savedQuestion = await newQuestion.save();

        // Add the question reference to the vehicle's questions array
        vehicle.questions.push(savedQuestion._id);
        await vehicle.save();

        res.status(201).json({ message: 'Pregunta enviada con éxito', question: savedQuestion });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'Error interno al enviar la pregunta' });
    }
};

// ====================================================================================
// BUSINESS LOGIC TO CREATE A RESPONSE
// Only the owner of the vehicle can respond to questions
exports.createAnswer = async (req, res) => {
    try {
        const { questionId, content } = req.body;
        const authorId = req.user.id; // From the authenticated token (the supposed owner)

        // 1. Find the question
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Pregunta no encontrada' });
        }

        // 2. Prevent answering a question that already has an answer
        if (question.answerId) {
            return res.status(400).json({ message: 'Esta pregunta ya tiene una respuesta' });
        }

        // 3. Verify that the user answering is actually the owner of the vehicle
        const vehicle = await Vehicle.findById(question.vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehículo asociado no encontrado' });
        }

        if (vehicle.ownerId.toString() !== authorId) {
            return res.status(403).json({ message: 'Sólo el dueño del vehículo puede responder las preguntas' });
        }

        // 4. Create the answer
        const newAnswer = new Answer({
            questionId,
            authorId,
            content
        });

        const savedAnswer = await newAnswer.save();

        // 5. Link the answer back to the question
        question.answerId = savedAnswer._id;
        await question.save();

        res.status(201).json({ message: 'Respuesta publicada con éxito', answer: savedAnswer });

    } catch (error) {
        console.error('Error creating answer:', error);
        res.status(500).json({ error: 'Error interno al enviar la respuesta' });
    }
};
