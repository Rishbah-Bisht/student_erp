const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

        // Generate JWT token
        const payload = {
            id: student._id,
            rollNo: student.rollNo,
            name: student.name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

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
                isFirstLogin: student.isFirstLogin
            }
        });
    } catch (error) {
        console.error('Error in studentLogin:', error);
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

        if (!student.isFirstLogin) {
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

        console.log('Attempting to save student profile...');
        await student.save();
        console.log('Student profile saved successfully');

        res.json({
            success: true,
            message: 'Setup completed successfully',
            student: {
                profileImage: student.profileImage,
                isFirstLogin: student.isFirstLogin
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
