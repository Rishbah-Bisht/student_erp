const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const feeRoutes = require('./routes/feeRoutes');
const resultRoutes = require('./routes/resultRoutes');

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

// Routes
app.use('/api', authRoutes);
app.use('/api/student/fees', feeRoutes);
app.use('/api/student/results', resultRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'missing',
            JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing'
        }
    });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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
    app.listen(PORT, () => {
        console.log(`Student Auth Server running on port ${PORT}`);
    });
}

module.exports = app;
