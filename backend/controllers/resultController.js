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
        const limit = Math.min(parseInt(req.query.limit || '0', 10), 100);
        const cursor = req.query.cursor;
        const usePagination = Number.isFinite(limit) && limit > 0;
        const subjectFilter = req.query.subject;

        // Fetch student to get batch info
        const student = await Student.findById(studentId).populate('batchId', 'name').select('batchId');
        const batchName = student && student.batchId ? student.batchId.name : 'N/A';

        // Fetch paginated or full results for this student
        const resultQuery = { studentId };
        if (usePagination && cursor) {
            if (!mongoose.Types.ObjectId.isValid(cursor)) {
                return res.status(400).json({ success: false, message: 'Invalid cursor' });
            }
            resultQuery._id = { $lt: mongoose.Types.ObjectId.createFromHexString(cursor) };
        }

        if (subjectFilter && subjectFilter !== 'All') {
            const examQuery = { subject: subjectFilter };
            const batchId = student?.batchId?._id || student?.batchId;
            if (batchId) examQuery.batchId = batchId;
            const subjectExams = await Exam.find(examQuery).select('_id').lean();
            const examIds = subjectExams.map(exam => exam._id);
            if (!examIds.length) {
                return res.json({
                    success: true,
                    results: [],
                    stats: null,
                    weakSubjects: [],
                    studentInfo: { batchName },
                    nextCursor: null
                });
            }
            resultQuery.examId = { $in: examIds };
        }

        const results = await ExamResult.find(resultQuery)
            .populate('examId', 'name subject chapter date totalMarks passingMarks')
            .sort({ _id: -1 })
            .limit(usePagination ? limit + 1 : 0)
            .lean();

        const hasMore = usePagination && results.length > limit;
        if (hasMore) results.pop();

        if (!results.length) {
            return res.json({
                success: true,
                results: [],
                stats: null,
                weakSubjects: [],
                studentInfo: { batchName },
                nextCursor: null
            });
        }

        const formattedResults = results.map(r => {
            const exam = r.examId;
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

        let stats = null;
        let weakSubjects = [];

        if (!usePagination || !cursor) {
            const statsAgg = await ExamResult.aggregate([
                { $match: { studentId: mongoose.Types.ObjectId.createFromHexString(studentId.toString()) } },
                {
                    $lookup: {
                        from: 'exams',
                        localField: 'examId',
                        foreignField: '_id',
                        as: 'exam'
                    }
                },
                { $unwind: '$exam' },
                {
                    $group: {
                        _id: '$exam.subject',
                        obtained: { $sum: '$marksObtained' },
                        total: { $sum: '$exam.totalMarks' },
                        tests: { $sum: 1 }
                    }
                }
            ]);

            let totalMarksObtained = 0;
            let totalMaxMarks = 0;
            const subjectStats = {};
            statsAgg.forEach((s) => {
                totalMarksObtained += s.obtained;
                totalMaxMarks += s.total;
                subjectStats[s._id] = { obtained: s.obtained, total: s.total, tests: s.tests };
            });

            const overallPercentage = totalMaxMarks > 0 ? calcPercentage(totalMarksObtained, totalMaxMarks) : 0;
            const totalTests = statsAgg.reduce((sum, s) => sum + (s.tests || 0), 0);

            for (const [subject, data] of Object.entries(subjectStats)) {
                const percent = (data.obtained / data.total) * 100;
                if (percent < 60) {
                    weakSubjects.push({ subject, percentage: percent.toFixed(2) });
                }
            }

            stats = {
                totalTests,
                overallPercentage,
                subjectStats
            };
        }

        res.json({
            success: true,
            results: formattedResults,
            stats,
            weakSubjects,
            studentInfo: { batchName },
            nextCursor: hasMore ? results[results.length - 1]._id : null
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
                    as: "examDetails",
                    pipeline: [{ $project: { totalMarks: 1, subject: 1 } }]
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

        pipeline.push({
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "_id",
                as: "student",
                pipeline: [{ $project: { name: 1, rollNo: 1, profileImage: 1, batchId: 1 } }]
            }
        });
        pipeline.push({ $unwind: { path: "$student", preserveNullAndEmptyArrays: true } });
        pipeline.push({
            $lookup: {
                from: "batches",
                localField: "student.batchId",
                foreignField: "_id",
                as: "batch",
                pipeline: [{ $project: { name: 1 } }]
            }
        });
        pipeline.push({ $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } });
        pipeline.push({
            $project: {
                studentId: "$_id",
                studentName: "$student.name",
                rollNo: "$student.rollNo",
                profileImage: "$student.profileImage",
                batchName: { $ifNull: ["$batch.name", "N/A"] },
                totalMarksObtained: 1,
                totalMaxMarks: 1,
                testCount: 1,
                percentage: { $round: ["$averagePercentage", 2] }
            }
        });

        const topScorers = await ExamResult.aggregate(pipeline);

        const leaderboard = topScorers.map((ts, idx) => ({
            rank: idx + 1,
            studentId: ts.studentId,
            studentName: ts.studentName || 'Unknown Student',
            rollNo: ts.rollNo || 'Unknown',
            profileImage: ts.profileImage || null,
            batchName: ts.batchName || 'N/A',
            totalMarksObtained: ts.totalMarksObtained,
            totalMaxMarks: ts.totalMaxMarks,
            percentage: Number(ts.percentage).toFixed(2),
            testCount: ts.testCount
        }));

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
    }
};
