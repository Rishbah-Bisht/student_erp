const http = require('http');

async function test() {
    // 1. Login to get token
    const loginData = JSON.stringify({ rollNo: 'STU2601', password: 'student@123' });
    const options = {
        hostname: 'localhost',
        port: 5005,
        path: '/api/student/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    const loginReq = http.request(options, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            const loginRes = JSON.parse(data);
            const token = loginRes.token;
            console.log('Logged in as STU2601');

            // 2. Get Overall LB
            getLB(token, 'overall');

            // 3. Get Subject LB (Math)
            getLB(token, 'subject', 'Mathematics');
        });
    });

    loginReq.write(loginData);
    loginReq.end();
}

function getLB(token, type, subject = '') {
    const path = `/api/student/results/leaderboard?type=${type}${subject ? '&subject=' + subject : ''}`;
    const options = {
        hostname: 'localhost',
        port: 5005,
        path: path,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
    };

    http.request(options, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            const lbRes = JSON.parse(data);
            console.log(`\nLeaderboard Type: ${type} ${subject}`);
            console.log(`Count: ${lbRes.leaderboard.length}`);
            lbRes.leaderboard.forEach(l => console.log(`- ${l.studentName} (${l.rollNo})` || '- Unknown'));
        });
    }).end();
}

test();
