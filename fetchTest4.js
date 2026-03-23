const url = 'http://localhost:3000/api/chat';
async function run() {
  const body = {
    messages: [{ role: 'user', content: 'hello' }],
    data: { mcpServers: [], plugins: [] }
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Since we are not doing a browser session, passing a fake cookie won't work unless we bypass in route.ts
        // Wait, I can pass the Supabase access token in Authorization header? No, supabase auth.getUser uses cookies in Next.js.
      },
      body: JSON.stringify(body)
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text}`);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
run();
