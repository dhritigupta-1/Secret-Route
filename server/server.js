const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ],
});

const app = express();

// Middleware
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    socket.on('disconnect', () => logger.info(`Client disconnected: ${socket.id}`));
});

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors());
app.use(express.json());

// Routes (We will add these back in a second)
app.get('/', (req, res) => {
    res.send("Secret Route API is running...");
});

// Use the routes we created earlier
const routePaths = require('./routes/routePaths');
const authRoute = require('./routes/auth');
const aiPaths = require('./routes/aiPaths');
const adminPaths = require('./routes/adminPaths');
const socialPaths = require('./routes/socialPaths');
app.use('/api/routes', routePaths);
app.use('/api/auth', authRoute);
app.use('/api/ai', aiPaths);
app.use('/api/admin', adminPaths);
app.use('/api/social', socialPaths);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        logger.info("MongoDB Connected...");
        server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    })
    .catch(err => logger.error("DB Connection Error:", err));