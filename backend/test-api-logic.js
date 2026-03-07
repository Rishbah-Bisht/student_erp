const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');
const examController = require('./controllers/resultController');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const student = await Student.findOne({ rollNo: 'STU2601' });

        // Mock req/res
        const req = {
            user: { id: student._id },
            query: { type: 'batch' }
        };
        const res = {
            json: (data) => {
                console.log('Leaderboard Data:', JSON.stringify(data, null, 2));
                process.exit();
            },
            status: (code) => ({
                json: (data) => {
                    console.log('Error:', code, data);
                    process.exit();
                }
            })
        };

        await examController.getLeaderboard(req, res);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
