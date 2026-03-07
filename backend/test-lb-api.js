const axios = require('axios');

async function test() {
    try {
        // We need a token. I'll login first.
        const loginRes = await axios.post('http://localhost:5005/api/student/auth/login', {
            rollNo: 'STU2603',
            password: 'student@123'
        });

        const token = loginRes.data.token;
        console.log('Logged in. Token retrieved.');

        const lbRes = await axios.get('http://localhost:5005/api/student/results/leaderboard', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Leaderboard Response:', JSON.stringify(lbRes.data, null, 2));
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}
test();
