const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    course: { type: String, trim: true },
    capacity: { type: Number },
    subjects: [{ type: String }],
    classroom: { type: String },
    schedule: [{
        day: { type: String },
        time: { type: String },
        subject: { type: String },
        teacher: { type: String },
        room: { type: String }
    }],
    timeSlots: [{ type: String }],
    fees: { type: Number },
    enrolledCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);
