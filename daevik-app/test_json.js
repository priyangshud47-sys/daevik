const req = new Request('http://localhost', {
  method: 'POST',
  body: '{"test": "val'
});
req.json().catch(console.error);
