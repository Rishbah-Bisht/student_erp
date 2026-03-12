const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadProfile } = require('../config/cloudinary');
const { cacheMiddleware } = require('../middleware/cache');

// Add Student (Admin Side)
router.post('/students/add', authController.addStudent);

// Student Login
router.post('/student/login', authController.studentLogin);

// Get Student Profile
router.get('/student/me', authMiddleware, cacheMiddleware(30), authController.getStudentProfile);

// Device registration + activity tracking
router.post('/student/device', authMiddleware, authController.registerDevice);
router.post('/student/activity', authMiddleware, authController.trackActivity);

// Get Subject Attendance Detail
router.get('/student/attendance/subject/:subjectId', authMiddleware, authController.getSubjectAttendanceDetail);

// Reset Password
router.post('/student/reset-password', authMiddleware, authController.resetPassword);

// Complete Setup (First Login)
router.post('/student/complete-setup', authMiddleware, uploadProfile.single('profileImage'), authController.completeSetup);

module.exports = router;
