const http = require('http');

const data = JSON.stringify({
  type: 'call',
  title: 'etrerte',
  description: 'erterte',
  customer_id: '1',
  scheduled_at: '2026-03-11T15:16',
  status: 'completed'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/activities',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
