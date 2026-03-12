const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    date: { type: Date },
    totalMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

examSchema.index({ batchId: 1, subject: 1, date: -1 });

module.exports = mongoose.model('Exam', examSchema);
