const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const feeRoutes = require('./routes/feeRoutes');
const resultRoutes = require('./routes/resultRoutes');
const { redis } = require('./middleware/cache');
const { connectToDatabase, getDatabaseHealth } = require('./config/database');
const { sendDatabaseUnavailable } = require('./utils/apiError');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Global security middleware
const cleanObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
            const safeKey = key.replace(/^\$|\./g, '_');
            obj[safeKey] = obj[key];
            delete obj[key];
        }
        if (typeof obj[key] === 'object') cleanObj(obj[key]);
    }
    return obj;
};
app.use((req, res, next) => {
    if (req.body) cleanObj(req.body);
    if (req.query) cleanObj(req.query);
    if (req.params) cleanObj(req.params);
    next();
});

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Health Check
app.get('/api/health', async (req, res) => {
    const { getDatabaseHealth, connectToDatabase } = require('./config/database');
    const postgres = require('./config/postgres');
    
    let database = getDatabaseHealth();
    if (!database.isHealthy) {
        try {
            await connectToDatabase();
            database = getDatabaseHealth();
        } catch (mErr) {
            console.error('Mongo Health Fix failed:', mErr.message);
        }
    }

    let postgresStatus = 'unknown';
    let postgresError = null;
    try {
        await postgres.query('SELECT NOW()');
        postgresStatus = 'connected';
    } catch (err) {
        postgresStatus = 'error';
        postgresError = err.message;
        console.error('Postgres Health Check Error:', err);
    }

    res.json({
        status: 'ok',
        mongodb: database.status,
        postgres: postgresStatus,
        postgresDetail: postgresError,
        redis: (require('./middleware/cache').redis) ? 'connected' : 'disabled',
        lastConnectedAt: database.lastConnectedAt,
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'missing',
            POSTGRES_URI: process.env.POSTGRES_URI ? 'set' : 'missing',
            JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing',
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

const ensureDatabase = async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('[database.ensureDatabase]', {
            path: req.originalUrl,
            method: req.method,
            message: error.message
        });

        sendDatabaseUnavailable(res);
    }
};

// Routes
app.use('/api', ensureDatabase);
app.use('/api', authRoutes);
app.use('/api/student/fees', feeRoutes);
app.use('/api/student/results', resultRoutes);

const PORT = process.env.PORT || 5005;

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

if (require.main === module) {
    connectToDatabase()
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => console.error('MongoDB connection error:', err.message));

    app.listen(PORT, () => {
        console.log(`Student Auth Server running on port ${PORT}`);
    });
}

module.exports = app;
