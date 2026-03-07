async function testPreflight() {
    try {
        const response = await fetch('http://localhost:5005/student/login', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST'
            }
        });

        console.log('OPTIONS Status:', response.status);
        console.log('CORS Headers:');
        console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
        console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testPreflight();
