const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Add Student (Admin Side)
router.post('/api/students/add', authController.addStudent);

// Student Login
router.post('/student/login', authController.studentLogin);

// Get Student Profile
const authMiddleware = require('../middleware/authMiddleware');
router.get('/api/student/me', authMiddleware, authController.getStudentProfile);

// Reset Password
router.post('/api/student/reset-password', authMiddleware, authController.resetPassword);

module.exports = router;
