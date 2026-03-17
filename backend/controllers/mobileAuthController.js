const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const authMiddleware = require('../middleware/authMiddleware');
const {
    buildStudentLoginResponse,
    hashRefreshToken,
    issueMobileSession,
    normalizeDeviceInfo,
    pruneMobileRefreshSessions
} = require('../utils/mobileAuth');
const { sendApiError } = require('../utils/apiError');

const sendAuthFailure = (res, status, error, message) => res.status(status).json({
    success: false,
    error,
    message
});

const updateStudentActivity = async (student, deviceInfo) => {
    const now = new Date();
    const portalAccess = student.portalAccess || {};

    student.portalAccess = {
        signupStatus: portalAccess.signupStatus || 'yes',
        signedUpAt: portalAccess.signedUpAt || now,
        lastLoginAt: now
    };
    student.lastActiveAt = now;
    student.lastAppOpenAt = now;

    const normalizedDevice = normalizeDeviceInfo(deviceInfo);
    if (Object.values(normalizedDevice).some(Boolean)) {
        student.lastDevice = normalizedDevice;
    }
};

exports.mobileLogin = async (req, res) => {
    try {
        let { rollNo, password } = req.body || {};

        if (!rollNo || !password) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: 'Roll number and password are required.'
            });
        }

        rollNo = String(rollNo).trim();
        const student = await Student.findOne({
            rollNo: { $regex: new RegExp(`^${rollNo}$`, 'i') }
        }).populate('batchId');

        if (!student) {
            return sendAuthFailure(res, 401, 'invalid_credentials', 'Invalid credentials.');
        }

        const passwordMatches = await bcrypt.compare(String(password), student.password || '');
        if (!passwordMatches) {
            return sendAuthFailure(res, 401, 'invalid_credentials', 'Invalid credentials.');
        }

        await updateStudentActivity(student, req.body);
        const session = await issueMobileSession(student, req.body);

        res.json({
            success: true,
            message: 'Login successful.',
            token: session.accessToken,
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            accessTokenExpiresAt: session.accessTokenExpiresAt?.toISOString() || null,
            expiresInSeconds: session.expiresInSeconds,
            student: buildStudentLoginResponse(student)
        });
    } catch (error) {
        console.error('Error in mobileLogin:', error);
        sendApiError(res, error, 'Login failed. Please try again.');
    }
};

exports.mobileRefresh = async (req, res) => {
    try {
        const refreshToken = String(req.body?.refreshToken || '').trim();
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'validation_error',
                message: 'Refresh token is required.'
            });
        }

        const tokenHash = hashRefreshToken(refreshToken);
        const student = await Student.findOne({
            'mobileRefreshSessions.tokenHash': tokenHash
        }).populate('batchId');

        if (!student) {
            return sendAuthFailure(res, 401, 'token_invalid', 'Refresh token is invalid.');
        }

        const now = new Date();
        pruneMobileRefreshSessions(student, now);

        const existingSession = student.mobileRefreshSessions.find((session) => session.tokenHash === tokenHash);
        if (!existingSession || existingSession.expiresAt <= now) {
            await student.save();
            return sendAuthFailure(res, 401, 'session_expired', 'Refresh token has expired.');
        }

        await updateStudentActivity(student, req.body);
        const session = await issueMobileSession(student, req.body, existingSession._id);

        res.json({
            success: true,
            message: 'Session refreshed.',
            token: session.accessToken,
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            accessTokenExpiresAt: session.accessTokenExpiresAt?.toISOString() || null,
            expiresInSeconds: session.expiresInSeconds,
            student: buildStudentLoginResponse(student)
        });
    } catch (error) {
        console.error('Error in mobileRefresh:', error);
        sendApiError(res, error, 'Unable to refresh the session right now.');
    }
};

exports.mobileLogout = async (req, res) => {
    try {
        const refreshToken = String(req.body?.refreshToken || '').trim();
        if (!refreshToken) {
            return res.json({ success: true, message: 'Session cleared.' });
        }

        const tokenHash = hashRefreshToken(refreshToken);
        const student = await Student.findOne({
            'mobileRefreshSessions.tokenHash': tokenHash
        });

        if (!student) {
            return res.json({ success: true, message: 'Session cleared.' });
        }

        student.mobileRefreshSessions = (student.mobileRefreshSessions || [])
            .filter((session) => session.tokenHash !== tokenHash);
        await student.save();

        res.json({ success: true, message: 'Logout successful.' });
    } catch (error) {
        console.error('Error in mobileLogout:', error);
        sendApiError(res, error, 'Unable to log out right now.');
    }
};

exports.mobileSession = [
    authMiddleware,
    async (req, res) => {
        try {
            const student = await Student.findById(req.user.id).populate('batchId');
            if (!student) {
                return sendAuthFailure(res, 401, 'token_invalid', 'Authentication failed. Please log in again.');
            }

            res.json({
                success: true,
                student: buildStudentLoginResponse(student),
                accessTokenExpiresAt: req.user.exp
                    ? new Date(req.user.exp * 1000).toISOString()
                    : null
            });
        } catch (error) {
            console.error('Error in mobileSession:', error);
            sendApiError(res, error, 'Unable to validate the session right now.');
        }
    }
];
