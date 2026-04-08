require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require('express-session');
const passport = require('./src/config/passport');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Middleware: the server can understand JSON format, from frontend to backend
app.use(express.json());

// Session and Passport
app.use(session({
    secret: process.env.JWT_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes of the application
const authRoutes = require("./src/routes/authRoutes");
const cedulaRoutes = require("./src/routes/cedulaRoutes");
const vehicleRoutes = require("./src/routes/vehicleRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/cedula", cedulaRoutes);
app.use("/api/vehicles", vehicleRoutes);
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