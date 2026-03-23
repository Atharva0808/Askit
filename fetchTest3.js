const url = 'http://localhost:3000/api/chat';
async function run() {
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] })
  });
  console.log(`Status: ${res.status}`);
  console.log(`Redirected: ${res.redirected}`);
  const text = await res.text();
  console.log(`Body: ${text.substring(0, 100)}`);
}
run();
