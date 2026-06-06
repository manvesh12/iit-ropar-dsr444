const http = require('http');

const loginData = JSON.stringify({
  username: 'demo@iitropar.ac.in',
  password: 'password123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Login Response:', body);
    try {
        const token = JSON.parse(body).token;
        if (!token) throw new Error('No token found');
        
        // Now submit the review
        const reviewData = JSON.stringify({
          action: 'RETURN',
          remarks: '[FRONT-MATTER]\nCover page title spelling is wrong.\n\n[CHAPTER-1]\nTable 1.1 missing row.'
        });

        const reviewOptions = {
          hostname: 'localhost',
          port: 8080,
          path: '/api/reports/1/workflow', // Assuming project ID is 1
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Content-Length': Buffer.byteLength(reviewData)
          }
        };

        const revReq = http.request(reviewOptions, (revRes) => {
          let revBody = '';
          revRes.on('data', (c) => revBody += c);
          revRes.on('end', () => {
            console.log('Workflow Response:', revRes.statusCode, revBody);
          });
        });
        
        revReq.on('error', (e) => console.error(e));
        revReq.write(reviewData);
        revReq.end();
    } catch(err) {
        console.error('Error parsing login response:', err);
    }
  });
});

req.on('error', (e) => console.error(`problem with request: ${e.message}`));
req.write(loginData);
req.end();
