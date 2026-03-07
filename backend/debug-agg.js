const mongoose = require('mongoose');
require('dotenv').config();
const ExamResult = require('./models/ExamResult');
const Student = require('./models/Student');
const Exam = require('./models/Exam');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const results = await ExamResult.find({});
        console.log('Total Results:', results.length);

        const studentIdsWithResults = [...new Set(results.map(r => r.studentId.toString()))];
        console.log('Unique Student IDs with results:', studentIdsWithResults.length);

        for (const sid of studentIdsWithResults) {
            const student = await Student.findById(sid);
            console.log(`Student ID: ${sid}, Name: ${student ? student.name : 'Unknown'}, RollNo: ${student ? student.rollNo : 'Unknown'}, Batch: ${student ? student.batchId : 'No Batch'}`);

            // Check results for this student
            const studentResults = results.filter(r => r.studentId.toString() === sid);
            const batchIds = [...new Set(studentResults.map(r => r.batchId.toString()))];
            console.log(`  - Results linked to batches: ${batchIds.join(', ')}`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
