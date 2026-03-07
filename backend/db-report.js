const mongoose = require('mongoose');
require('dotenv').config();
const ExamResult = require('./models/ExamResult');
const Student = require('./models/Student');
const Exam = require('./models/Exam');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Students ---');
        const students = await Student.find({});
        students.forEach(s => {
            console.log(`- ${s.name} (${s.rollNo}) | Batch: ${s.batchId} | ID: ${s._id}`);
        });

        console.log('\n--- Exam Results ---');
        const results = await ExamResult.find({});
        for (const r of results) {
            const s = students.find(st => st._id.toString() === r.studentId.toString());
            console.log(`- Result for: ${s ? s.name : 'UNKNOWN'} | Batch in Result: ${r.batchId} | Marks: ${r.marksObtained}`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
