const ExamResult = require('../models/ExamResult');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// Helper function to calculate percentage
const calcPercentage = (obtained, total) => ((obtained / total) * 100).toFixed(2);

// GET /api/student/results
exports.getStudentResults = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Fetch student to get batch info
        const student = await Student.findById(studentId).populate('batchId', 'name');
        const batchName = student && student.batchId ? student.batchId.name : 'N/A';

        // Fetch all results for this student and populate the exam details
        const results = await ExamResult.find({ studentId })
            .populate('examId', 'name subject chapter date totalMarks passingMarks')
            .sort({ uploadedAt: -1 })
            .lean();

        if (!results.length) {
            return res.json({
                success: true,
                results: [],
                stats: null,
                weakSubjects: [],
                studentInfo: { batchName } // Return even if no results
            });
        }

        let totalMarksObtained = 0;
        let totalMaxMarks = 0;
        let subjectStats = {};

        const formattedResults = results.map(r => {
            const exam = r.examId;
            if (exam) {
                totalMarksObtained += r.marksObtained;
                totalMaxMarks += exam.totalMarks;

                // Aggregate per subject
                if (!subjectStats[exam.subject]) {
                    subjectStats[exam.subject] = { obtained: 0, total: 0, tests: 0 };
                }
                subjectStats[exam.subject].obtained += r.marksObtained;
                subjectStats[exam.subject].total += exam.totalMarks;
                subjectStats[exam.subject].tests += 1;
            }

            return {
                id: r._id,
                examName: exam ? exam.name : 'Unknown Exam',
                subject: exam ? exam.subject : 'Unknown',
                chapter: exam ? exam.chapter : 'Unknown',
                date: exam ? exam.date : r.uploadedAt,
                marksObtained: r.marksObtained,
                totalMarks: exam ? exam.totalMarks : 100,
                passingMarks: exam ? exam.passingMarks : 40,
                percentage: exam ? calcPercentage(r.marksObtained, exam.totalMarks) : 0,
                hasPassed: exam ? (r.marksObtained >= exam.passingMarks) : false,
                remarks: r.remarks
            };
        });

        const overallPercentage = totalMaxMarks > 0 ? calcPercentage(totalMarksObtained, totalMaxMarks) : 0;

        // Calculate weak subjects (average < 60%)
        const weakSubjects = [];
        for (const [subject, data] of Object.entries(subjectStats)) {
            const percent = (data.obtained / data.total) * 100;
            if (percent < 60) {
                weakSubjects.push({ subject, percentage: percent.toFixed(2) });
            }
        }

        res.json({
            success: true,
            results: formattedResults,
            stats: {
                totalTests: results.length,
                overallPercentage,
                subjectStats
            },
            weakSubjects,
            studentInfo: { batchName }
        });
    } catch (error) {
        console.error('Error fetching student results:', error);
        res.status(500).json({ success: false, message: 'Server error fetching results' });
    }
};

// GET /api/student/results/leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const { type, subject } = req.query;
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // 1. Determine the Match Scope
        let matchQuery = {};

        if (type === 'subject' && subject && subject !== 'All') {
            // Global Subject-wise: No batch filter, just the subject
            // We'll join with exams first, then filter by subject
        } else {
            // Batch-wise (Overall): Restricted to current student's batch
            const batchId = student.batchId;
            if (!batchId) return res.json({ success: true, leaderboard: [] });
            matchQuery.batchId = mongoose.Types.ObjectId.createFromHexString(batchId.toString());
        }

        // 2. Build Pipeline
        const pipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: "exams",
                    localField: "examId",
                    foreignField: "_id",
                    as: "examDetails"
                }
            },
            { $unwind: "$examDetails" }
        ];

        // 3. Subject Filter (if system-wide or batch-specific subject)
        if (subject && subject !== 'All') {
            pipeline.push({ $match: { "examDetails.subject": subject } });
        }

        // 4. Group by student
        pipeline.push({
            $group: {
                _id: "$studentId",
                totalMarksObtained: { $sum: "$marksObtained" },
                totalMaxMarks: { $sum: "$examDetails.totalMarks" },
                testCount: { $sum: 1 }
            }
        });

        // 5. Calculate Metrics
        pipeline.push({
            $project: {
                studentId: "$_id",
                totalMarksObtained: 1,
                totalMaxMarks: 1,
                testCount: 1,
                averagePercentage: {
                    $cond: [
                        { $eq: ["$totalMaxMarks", 0] },
                        0,
                        { $multiply: [{ $divide: ["$totalMarksObtained", "$totalMaxMarks"] }, 100] }
                    ]
                }
            }
        });

        // 6. Sort and Limit Top 10
        pipeline.push({ $sort: { averagePercentage: -1 } });
        pipeline.push({ $limit: 10 });

        // 7. Populate Student Data with Batch Info
        const topScorers = await ExamResult.aggregate(pipeline);

        const leaderboard = await Promise.all(topScorers.map(async (ts, idx) => {
            const stu = await Student.findById(ts.studentId).populate('batchId', 'name');
            return {
                rank: idx + 1,
                studentName: stu ? stu.name : 'Unknown Student',
                rollNo: stu ? stu.rollNo : 'Unknown',
                profileImage: stu ? stu.profileImage : null,
                batchName: stu && stu.batchId ? stu.batchId.name : 'N/A',
                totalMarksObtained: ts.totalMarksObtained,
                totalMaxMarks: ts.totalMaxMarks,
                percentage: ts.averagePercentage.toFixed(2),
                testCount: ts.testCount
            };
        }));

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
    }
};
