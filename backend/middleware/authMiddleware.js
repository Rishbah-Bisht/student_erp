const jwt = require('jsonwebtoken');

const sendUnauthorized = (res, error, message) => res.status(401).json({
    success: false,
    error,
    message
});

const extractBearerToken = (authorizationHeader) => {
    const raw = String(authorizationHeader || '').trim();
    if (!raw) return null;

    // Some WebView/XHR stacks can append duplicate Authorization values separated by commas.
    const candidates = raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    for (const candidate of candidates) {
        const match = candidate.match(/^Bearer\s+(.+)$/i);
        if (match?.[1]) {
            return match[1].trim();
        }
    }

    return null;
};

const authMiddleware = (req, res, next) => {
    try {
        const token = extractBearerToken(req.header('Authorization'));

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
