const http = require('http');

const data = JSON.stringify({
  name: 'Test Student',
  mobile: '9876543210',
  email: 'test@test.com',
  studentClass: '10',
  subject: 'Mathematics'
});

// Test 1: POST /api/demo (create booking)
const postOpts = {
  host: 'localhost', port: 5000,
  path: '/api/demo', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};

console.log('Test 1: POST /api/demo...');
const postReq = http.request(postOpts, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('POST Status:', res.statusCode);
    console.log('POST Response:', body);

    // Test 2: GET /api/demo (list bookings with admin token)
    // First get admin token
    const loginData = JSON.stringify({ email: 'srmclasses01@gmail.com', password: 'SRMAdmin@2026' });
    const loginOpts = {
      host: 'localhost', port: 5000,
      path: '/api/admin/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    };
    console.log('\nTest 2: Admin Login...');
    const loginReq = http.request(loginOpts, (lRes) => {
      let lBody = '';
      lRes.on('data', c => lBody += c);
      lRes.on('end', () => {
        console.log('Login Status:', lRes.statusCode);
        const loginJson = JSON.parse(lBody);
        console.log('Login Success:', loginJson.success);
        const token = loginJson.token;

        if (!token) {
          console.log('❌ No token received:', lBody);
          return;
        }

        // Test 3: GET bookings list with token
        const getOpts = {
          host: 'localhost', port: 5000,
          path: '/api/demo', method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        };
        console.log('\nTest 3: GET /api/demo (admin)...');
        http.get({ ...getOpts }, (gRes) => {
          let gBody = '';
          gRes.on('data', c => gBody += c);
          gRes.on('end', () => {
            console.log('GET Status:', gRes.statusCode);
            console.log('GET Response:', gBody);
            const parsed = JSON.parse(gBody);
            console.log('\n✅ TOTAL BOOKINGS FOUND:', parsed.count);
            if (parsed.data?.length > 0) {
              console.log('First booking:', JSON.stringify(parsed.data[0], null, 2));
            }
          });
        });
      });
    });
    loginReq.write(loginData);
    loginReq.end();
  });
});
postReq.on('error', e => console.error('❌ FAILED:', e.message));
postReq.write(data);
postReq.end();
