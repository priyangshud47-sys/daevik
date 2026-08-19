async function test() {
  const res = await fetch('https://daevik.in/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productSlug: 'zero-investment-guide',
      customerName: 'Test',
      customerEmail: 'test@example.com',
      customerPhone: '9999999999'
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}
test();
