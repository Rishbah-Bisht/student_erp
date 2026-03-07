const Student = require('../models/Student');
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
        res.status(500).json({ success: false, message: 'Server error' });
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
                batch: student.batchId ? student.batchId.name : 'N/A' // Return batch name instead of ID
            }
        });
    } catch (error) {
        console.error('Error in studentLogin:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const Batch = require('../models/Batch');

// Get Student Profile
exports.getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate('batchId')
            .select('-password');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Extract teachers and room from batch if available
        let subjectTeachers = student.subjectTeachers || [];
        let roomAllocation = student.roomAllocation || 'N/A';

        if (student.batchId) {
            const batch = student.batchId;
            roomAllocation = batch.classroom || roomAllocation;

            // Extract unique subject-teacher pairs from batch schedule
            if (batch.schedule && batch.schedule.length > 0) {
                const teachersMap = new Map();
                batch.schedule.forEach(slot => {
                    if (slot.subject) {
                        // We prefer slots with an assigned teacher
                        const existing = teachersMap.get(slot.subject);
                        const currentTeacher = slot.teacher || 'Unassigned';

                        if (!existing || (existing === 'Unassigned' && currentTeacher !== 'Unassigned')) {
                            teachersMap.set(slot.subject, currentTeacher);
                        }
                    }
                });

                if (teachersMap.size > 0) {
                    subjectTeachers = Array.from(teachersMap.entries()).map(([subject, teacher]) => ({
                        subject,
                        teacher
                    }));
                }
            }
        }

        // Map real data from DB if available
        const profileData = {
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email || 'N/A',
            contact: student.contact || 'N/A', // Added contact field
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
            // Keep stats mock if not in DB
            attendance: { present: 45, total: 50, percentage: 90 },
            assignments: { total: 12, pending: 2 }
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
