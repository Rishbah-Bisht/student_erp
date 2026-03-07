const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    const Student = require('./backend/models/Student');
    const students = await Student.find().lean();
    console.log(`Found ${students.length} students.`);
    if (students.length > 0) {
        console.log('Sample student 1:', students[0].rollNo, 'Password:', students[0].password);
    }
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
