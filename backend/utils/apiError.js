const DATABASE_ERROR_PATTERNS = [
    /buffering timed out/i,
    /server selection/i,
    /topology.*destroyed/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /EHOSTUNREACH/i,
    /MongoNetworkError/i,
    /MongoServerSelectionError/i,
    /connection .* closed/i,
    /Client must be connected/i,
    /Tenant or user not found/i,
    /password authentication failed/i,
    /connection terminated unexpectedly/i,
    /no pg_hba\.conf entry/i,
    /the database system is starting up/i,
    /too many clients already/i,
    /\bXX000\b/i,
    /\b57P03\b/i,
    /\b08006\b/i,
    /getaddrinfo/i
];

const isDatabaseUnavailableError = (error) => {
    if (!error) {
        return false;
    }

    const haystack = [error.name, error.message, error.code]
        .filter(Boolean)
        .join(' ');

    return DATABASE_ERROR_PATTERNS.some((pattern) => pattern.test(haystack));
};

const sendDatabaseUnavailable = (res) => res.status(503).json({
    success: false,
    error: 'db_unavailable',
    code: 'DATABASE_UNAVAILABLE',
    message: 'Database is waking up or temporarily unavailable. Please try again in a few moments.'
});

const sendApiError = (res, error, fallbackMessage = 'Internal Server Error') => {
    if (isDatabaseUnavailableError(error)) {
        return sendDatabaseUnavailable(res);
    }

    const message = error?.status && error?.message
        ? error.message
        : fallbackMessage;

    const response = {
        success: false,
        message
    };

    if (process.env.NODE_ENV === 'development' && error?.message) {
        response.debug = error.message;
    }

    return res.status(error?.status || 500).json(response);
};

module.exports = {
    isDatabaseUnavailableError,
    sendApiError,
    sendDatabaseUnavailable
};
