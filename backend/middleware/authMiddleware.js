const jwt = require('jsonwebtoken');

const sendUnauthorized = (res, error, message) => res.status(401).json({
    success: false,
    error,
    message
});

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return sendUnauthorized(res, 'token_missing', 'Authentication token is required.');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error?.name === 'TokenExpiredError') {
            return sendUnauthorized(res, 'session_expired', 'Your session expired. Please log in again.');
        }

        return sendUnauthorized(res, 'token_invalid', 'Token verification failed, authorization denied.');
    }
};

module.exports = authMiddleware;
