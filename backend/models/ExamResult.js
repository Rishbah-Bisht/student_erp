const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    isPresent: { type: Boolean, default: true },
    remarks: { type: String, trim: true, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Unique per student per exam
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ studentId: 1, uploadedAt: -1 });
examResultSchema.index({ batchId: 1, examId: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
