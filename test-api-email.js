const http = require('http');

// A simple multipart/form-data generator
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const data = `--${boundary}\r
Content-Disposition: form-data; name="type"\r
\r
email\r
--${boundary}\r
Content-Disposition: form-data; name="title"\r
\r
Test Email from Script\r
--${boundary}\r
Content-Disposition: form-data; name="description"\r
\r
\r
--${boundary}\r
Content-Disposition: form-data; name="customer_id"\r
\r
1\r
--${boundary}\r
Content-Disposition: form-data; name="scheduled_at"\r
\r
2026-03-11T16:00\r
--${boundary}\r
Content-Disposition: form-data; name="email_to"\r
\r
test@ikalus-167jkt.com\r
--${boundary}\r
Content-Disposition: form-data; name="email_subject"\r
\r
Direct API Test\r
--${boundary}\r
Content-Disposition: form-data; name="email_body"\r
\r
Testing to see where the API fails.\r
--${boundary}--\r
`;

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/activities/send-email',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(data),
    // Simulate auth token by cookie
    'Cookie': 'token=' // Wait, I don't have the user token!
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', console.error);
req.write(data);
req.end();
