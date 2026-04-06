require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Middleware: the server can understand JSON format, from frontend to backend
app.use(express.json());

// Routes of the application
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/vehicles", require("./src/routes/vehicleRoutes"));
app.use("/api/qa", require("./src/routes/qaRoutes"));
app.use("/api/chat", require("./src/routes/chatRoutes"));

// Mongo Connection
const mongoString = process.env.DATABASE_URL;

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log('Error MongoDB:', error);
});

database.once('connected', () => {
    console.log('Database Connected');
});

// this is the route to serve the frontend files
// 1. we tell to express where is the public folder
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. we tell to express that if the request is not for an API route, it should serve the index.html file
app.use('/src', express.static(path.join(__dirname, '../frontend/src')));

// 3. when someone tries to access the root route, it should serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// the port, if the environment variable PORT is not defined, it will use 3000
const PORT = process.env.PORT || 3000; // this way is more secure 

// lets start the server
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });