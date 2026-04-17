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

// GraphQL Imports
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const typeDefs = require('./src/graphql/typeDefs');
const resolvers = require('./src/graphql/resolvers');
const jwt = require('jsonwebtoken');

async function startServer() {
    // 1. Setup Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        formatError: (error) => {
            console.error('GraphQL Error:', error);
            return error;
        },
    });

    await server.start();

    // 2. Middleware for Apollo
    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req }) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) return { user: null };

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                return { user: decoded.user };
            } catch (err) {
                return { user: null };
            }
        },
    }));

    app.use("/api/auth", authRoutes);
    app.use("/api/cedula", cedulaRoutes);
    app.use("/api/vehicles", vehicleRoutes);
    app.use("/api/qa", require("./src/routes/qaRoutes"));
    app.use("/api/chat", require("./src/routes/chatRoutes"));

    // Mongo Connection
    const mongoString = process.env.DATABASE_URL;
    mongoose.connect(mongoString);
    const database = mongoose.connection;

    database.once('connected', () => { console.log('Database Connected'); });

    // Serve frontend files
    app.use(express.static(path.join(__dirname, '../frontend/public')));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use('/src', express.static(path.join(__dirname, '../frontend/src')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => { 
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 GraphQL ready at http://localhost:${PORT}/graphql`);
    });
}

startServer().catch(err => {
    console.error('Error starting server:', err);
});