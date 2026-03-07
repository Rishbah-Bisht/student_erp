const mongoose = require('mongoose');
require('dotenv').config();
const ExamResult = require('./models/ExamResult');
const Student = require('./models/Student');
const Exam = require('./models/Exam');

async function diagnostic() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const currentUser = await Student.findOne({ rollNo: 'STU2601' }); // Change as needed
        if (!currentUser) {
            console.log('STU2601 not found');
            process.exit();
        }

        const batchId = currentUser.batchId;
        console.log('Current User Batch ID:', batchId);

        // 1. Students in this batch
        const studentsInBatch = await Student.find({ batchId });
        console.log('Students in this batch (from Student collection):', studentsInBatch.length);
        studentsInBatch.forEach(s => console.log(`  - ${s.name} (${s.rollNo}) [${s._id}]`));

        // 2. Results linked to this batchId in ExamResult
        const resultsInBatch = await ExamResult.find({ batchId });
        console.log('\nResults linked to this batchId in ExamResult collection:', resultsInBatch.length);

        const uniqueStudentIdsInResults = [...new Set(resultsInBatch.map(r => r.studentId.toString()))];
        console.log('Unique Student IDs found in these results:', uniqueStudentIdsInResults.length);

        for (const sid of uniqueStudentIdsInResults) {
            const stu = await Student.findById(sid);
            console.log(`  - Student ID: ${sid} | Name: ${stu ? stu.name : 'UNKNOWN'} | Batch: ${stu ? stu.batchId : 'N/A'}`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
diagnostic();
