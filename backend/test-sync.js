const http = require('http');

const data = JSON.stringify({
  blocks: [
    { type: 'paragraph', content: { text: 'test' }, orderIndex: 1 }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/documents/test-id/blocks', // Need a real ID and token!
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.write(data);
req.end();
