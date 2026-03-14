const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Attendance = require('../models/Attendance');
require('../models/Subject');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { invalidateUserCache } = require('../middleware/cache');

const normalizeDeviceInfo = (payload = {}) => ({
    platform: String(payload.platform || '').trim(),
    model: String(payload.model || '').trim(),
    manufacturer: String(payload.manufacturer || '').trim(),
    appVersion: String(payload.appVersion || '').trim(),
    deviceId: String(payload.deviceId || '').trim(),
    appType: String(payload.appType || '').trim(),
    packageName: String(payload.packageName || '').trim()
});

const getActivityWindow = () => {
    const minutes = parseInt(process.env.ACTIVITY_UPDATE_MINUTES || '5', 10);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
};

const getAttendanceSnapshot = async (studentId) => {
    const match = { studentId };

    const [rows, subjectRows, recentRows] = await Promise.all([
        Attendance.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Attendance.aggregate([
            { $match: match },
            { 
                $group: { 
                    _id: '$subjectId', 
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
                    total: { $sum: 1 }
                } 
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subject'
                }
            },
            { $unwind: '$subject' },
            {
                $project: {
                    subjectId: '$_id',
                    subjectName: '$subject.name',
                    subjectCode: '$subject.code',
                    present: 1,
                    absent: 1,
                    late: 1,
                    total: 1,
                    percentage: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0] },
                            0
                        ]
                    }
                }
            }
        ]),
        Attendance.find(match)
            .sort({ attendanceDate: -1, createdAt: -1, _id: -1 })
            .limit(8)
            .populate('subjectId', 'name code')
            .lean()
    ]);

    const present = rows.find((row) => row._id === 'Present')?.count || 0;
    const absent = rows.find((row) => row._id === 'Absent')?.count || 0;
    const late = rows.find((row) => row._id === 'Late')?.count || 0;
    const total = present + absent + late;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
        summary: { total, present, absent, late, percentage },
        subjects: subjectRows,
        recent: recentRows.map((row) => ({
            _id: row._id,
            status: row.status,
            attendanceDate: row.attendanceDate,
            subjectId: row.subjectId
                ? {
                    _id: row.subjectId._id,
                    name: row.subjectId.name,
                    code: row.subjectId.code
                }
                : null,
            subjectName: row.subjectId?.name || ''
        }))
    };
};

exports.getSubjectAttendanceDetail = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const studentId = req.user.id;

        const records = await Attendance.find({ studentId, subjectId })
            .sort({ attendanceDate: -1 })
            .lean();

        res.json({ success: true, records });
    } catch (error) {
        console.error('Error in getSubjectAttendanceDetail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add Student (Admin Side)
exports.addStudent = async (req, res) => {
    try {
        const { name, rollNo, password, className, batchId } = req.body;

        // Check if student already exists
        const existingStudent = await Student.findOne({ rollNo });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'Student with this roll number already exists.' });
        }

        // Create new student
        const newStudent = new Student({
            name,
            rollNo,
            password, // Password will be hashed by the pre-save hook in the model
            className,
            batchId
        });

        await newStudent.save();

        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            student: {
                _id: newStudent._id,
                name: newStudent.name,
                rollNo: newStudent.rollNo,
                className: newStudent.className,
                batchId: newStudent.batchId
            }
        });
    } catch (error) {
        console.error('Error in addStudent:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Student Login
exports.studentLogin = async (req, res) => {
    try {
        let { rollNo, password } = req.body;

        if (!rollNo || !password) {
            return res.status(400).json({ success: false, message: 'Please provide roll number and password' });
        }

        rollNo = rollNo.trim();

        // Check if student exists (case-insensitive) and populate batch
        const student = await Student.findOne({ rollNo: { $regex: new RegExp(`^${rollNo}$`, 'i') } }).populate('batchId');
        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const now = new Date();
        const portalAccess = student.portalAccess || {};
        student.portalAccess = {
            signupStatus: portalAccess.signupStatus || 'yes',
            signedUpAt: portalAccess.signedUpAt || now,
            lastLoginAt: now
        };
        student.lastActiveAt = now;
        student.lastAppOpenAt = now;
        await student.save();

        // Generate JWT token
        const payload = {
            id: student._id,
            rollNo: student.rollNo,
            name: student.name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        const needsSetup = student.isFirstLogin || !student.profileImage;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            student: {
                id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                class: student.className, // Frontend expects 'class' in its dashboard
                batch: student.batchId ? student.batchId.name : 'N/A', // Return batch name instead of ID
                isFirstLogin: student.isFirstLogin,
                profileImage: student.profileImage || null,
                needsSetup
            }
        });
    } catch (error) {
        console.error('Error in studentLogin:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

exports.registerDevice = async (req, res) => {
    try {
        const { fcmToken } = req.body || {};
        if (!fcmToken || !String(fcmToken).trim()) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        const now = new Date();
        const token = String(fcmToken).trim();
        const deviceInfo = normalizeDeviceInfo(req.body);

        await Student.updateOne(
            { _id: req.user.id },
            {
                $addToSet: { deviceTokens: token },
                $set: {
                    lastDevice: deviceInfo,
                    lastAppOpenAt: now,
                    lastActiveAt: now
                }
            }
        );

        console.info('[student.registerDevice]', {
            studentId: String(req.user.id),
            platform: deviceInfo.platform || 'unknown',
            packageName: deviceInfo.packageName || '',
            tokenTail: token.slice(-12),
            registeredAt: now.toISOString()
        });

        res.json({ success: true, message: 'Device registered', registeredAt: now.toISOString() });
    } catch (error) {
        console.error('Error in registerDevice:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

exports.trackActivity = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'User not identified' });
        }

        const event = String(req.body?.event || 'heartbeat').toLowerCase();
        const now = new Date();
        const update = { $set: { lastActiveAt: now } };

        if (event === 'app_open') {
            update.$set.lastAppOpenAt = now;
        }

        const deviceInfo = normalizeDeviceInfo(req.body);
        const hasDevicePayload = Object.values(deviceInfo).some((val) => val);
        if (hasDevicePayload) {
            update.$set.lastDevice = deviceInfo;
        }

        // If it's an app_open, always update
        if (event === 'app_open') {
            await Student.updateOne({ _id: req.user.id }, update);
            return res.json({ success: true, message: 'Activity recorded (open)', updated: true });
        }

        const minMinutes = getActivityWindow();
        const threshold = new Date(now.getTime() - minMinutes * 60 * 1000);

        // For heartbeat, only update if threshold passed
        const result = await Student.updateOne(
            {
                _id: req.user.id,
                $or: [
                    { lastActiveAt: { $lt: threshold } },
                    { lastActiveAt: { $exists: false } },
                    { lastActiveAt: null }
                ]
            },
            update
        );

        res.json({ success: true, message: 'Activity recorded', updated: result.modifiedCount > 0 });
    } catch (error) {
        console.error('[authController.trackActivity] CRITICAL ERROR:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Get Student Profile
exports.getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate('batchId')
            .select('-password');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // ── Extract teachers and room ───────────────────────────────────────
        let roomAllocation = student.roomAllocation || 'N/A';
        const teachersMap = new Map();

        // 1. First, populate from Student's own subjectTeachers (individual override)
        if (student.subjectTeachers && student.subjectTeachers.length > 0) {
            student.subjectTeachers.forEach(st => {
                if (st.subject && st.teacher) {
                    teachersMap.set(st.subject, st.teacher);
                }
            });
        }

        // 2. Query Teacher assignments for this batch (Source of truth for Admin)
        if (student.batchId) {
            const batchIdStr = student.batchId._id.toString();
            const teachers = await Teacher.find({ 'assignments.batchId': student.batchId._id })
                .select('name assignments')
                .lean();

            teachers.forEach(t => {
                const batchAssignment = t.assignments.find(a => a.batchId?.toString() === batchIdStr);
                if (batchAssignment && batchAssignment.subjects) {
                    batchAssignment.subjects.forEach(sub => {
                        // Only set if not already set by student-specific override
                        if (!teachersMap.has(sub) || teachersMap.get(sub) === 'Unassigned') {
                            teachersMap.set(sub, t.name);
                        }
                    });
                }
            });

            // Overlay basic info from batch
            const batch = student.batchId;
            roomAllocation = batch.classroom || roomAllocation;

            // Add any subjects listed in batch that still don't have a teacher
            if (batch.subjects && batch.subjects.length > 0) {
                batch.subjects.forEach(s => {
                    if (!teachersMap.has(s)) teachersMap.set(s, 'Unassigned');
                });
            }

            // Fallback: Merge from batch schedule (if any teacher info lives there)
            if (batch.schedule && batch.schedule.length > 0) {
                batch.schedule.forEach(slot => {
                    if (slot.subject) {
                        const currentTeacher = slot.teacher || 'Unassigned';
                        const existing = teachersMap.get(slot.subject);

                        if (!existing || existing === 'Unassigned') {
                            if (currentTeacher !== 'Unassigned') {
                                teachersMap.set(slot.subject, currentTeacher);
                            } else if (!existing) {
                                teachersMap.set(slot.subject, 'Unassigned');
                            }
                        }
                    }
                });
            }
        }

        // 3. Calculate Subject Averages ──────────────────────────────────
        let subjectStatsMap = new Map();
        if (student.batchId) {
            const results = await ExamResult.find({ studentId: student._id })
                .populate('examId')
                .lean();

            results.forEach(r => {
                if (r.examId && r.examId.subject) {
                    const sub = r.examId.subject;
                    if (!subjectStatsMap.has(sub)) {
                        subjectStatsMap.set(sub, { totalObtained: 0, totalPossible: 0 });
                    }
                    const stats = subjectStatsMap.get(sub);
                    stats.totalObtained += r.marksObtained || 0;
                    stats.totalPossible += r.examId.totalMarks || 100;
                }
            });
        }

        const subjectTeachers = Array.from(teachersMap.entries()).map(([subject, teacher]) => {
            let averageMarks = 0;
            if (subjectStatsMap.has(subject)) {
                const stats = subjectStatsMap.get(subject);
                averageMarks = Math.round((stats.totalObtained / stats.totalPossible) * 100);
            }
            return {
                subject,
                teacher,
                averageMarks
            };
        });

        // Calculate Global Average
        let overallTotalObtained = 0;
        let overallTotalPossible = 0;
        subjectStatsMap.forEach(stats => {
            overallTotalObtained += stats.totalObtained;
            overallTotalPossible += stats.totalPossible;
        });
        const overallAverage = overallTotalPossible > 0
            ? Math.round((overallTotalObtained / overallTotalPossible) * 100)
            : 0;

        // Map real data from DB if available
        const profileData = {
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email || 'N/A',
            contact: student.contact || 'N/A',
            className: student.className,
            batchName: student.batchId ? student.batchId.name : 'N/A',
            activeBatchId: student.batchId ? student.batchId._id : null,
            fullBatchData: student.batchId || null,
            fees: student.fees || 0,
            registrationFee: student.registrationFee || 0,
            feesPaid: student.feesPaid || 0,
            profileImage: student.profileImage || null,
            fatherName: student.fatherName || 'N/A',
            motherName: student.motherName || 'N/A',
            dob: student.dob,
            gender: student.gender,
            address: student.address,
            admissionDate: student.admissionDate,
            session: student.session,
            status: student.status,
            subjectTeachers,
            roomAllocation,
            overallAverage
        };

        const attendance = await getAttendanceSnapshot(student._id);
        profileData.attendanceSummary = attendance.summary;
        profileData.attendanceSubjects = attendance.subjects;
        profileData.attendanceRecent = attendance.recent;

        res.json({ success: true, student: profileData });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, student.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid current password.' });
        }

        // Update password (pre-save hook will hash it)
        student.password = newPassword;
        await student.save();

        await invalidateUserCache(student._id.toString());

        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};
// Complete Setup (First Login)
exports.completeSetup = async (req, res) => {
    try {
        console.log('--- completeSetup Debug ---');
        console.log('User ID:', req.user?.id);
        console.log('File:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            path: req.file.path
        } : 'No file received');
        console.log('Body:', req.body);

        const { newPassword } = req.body;
        const student = await Student.findById(req.user.id);

        if (!student) {
            console.warn('Student not found for ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const needsSetup = student.isFirstLogin || !student.profileImage;
        if (!needsSetup) {
            console.warn('Setup already completed for student:', student.rollNo);
            return res.status(400).json({ success: false, message: 'Setup already completed' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a professional profile picture' });
        }

        // Update password
        if (newPassword) {
            student.password = newPassword;
        }

        // Save image path and mark setup as complete
        student.profileImage = req.file.path; // Cloudinary URL
        student.isFirstLogin = false;
        student.portalAccess = {
            ...(student.portalAccess || {}),
            signupStatus: 'yes',
            signedUpAt: student.portalAccess?.signedUpAt || new Date(),
            lastLoginAt: student.portalAccess?.lastLoginAt || new Date()
        };

        console.log('Attempting to save student profile...');
        await student.save();
        console.log('Student profile saved successfully');

        await invalidateUserCache(student._id.toString());

        res.json({
            success: true,
            message: 'Setup completed successfully',
            student: {
                profileImage: student.profileImage,
                isFirstLogin: student.isFirstLogin,
                needsSetup: false
            }
        });
    } catch (error) {
        console.error('CRITICAL ERROR in completeSetup:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
