const http = require('http');
const crypto = require('crypto');

// A simple multipart/form-data generator
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const data = `--${boundary}\r
Content-Disposition: form-data; name="type"\r
\r
email\r
--${boundary}\r
Content-Disposition: form-data; name="title"\r
\r
Test Email from Script with Attachment\r
--${boundary}\r
Content-Disposition: form-data; name="description"\r
\r
\r
--${boundary}\r
Content-Disposition: form-data; name="customer_id"\r
\r
4\r
--${boundary}\r
Content-Disposition: form-data; name="email_to"\r
\r
test@ikalus-167jkt.com\r
--${boundary}\r
Content-Disposition: form-data; name="email_subject"\r
\r
Direct API Test Attachment\r
--${boundary}\r
Content-Disposition: form-data; name="email_body"\r
\r
Testing to see where the API fails with attachments.\r
--${boundary}\r
Content-Disposition: form-data; name="attachment"; filename="test.txt"\r
Content-Type: text/plain\r
\r
Hello World\r
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
