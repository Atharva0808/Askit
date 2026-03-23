const url = 'http://localhost:3000/api/chat';

async function run() {
  const body = {
    messages: [{ role: 'user', content: 'Please analyze the attached document.' }],
    data: { mcpServers: [], plugins: [] }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Missing auth cookie -> might return 401. I'll need to bypass auth in route.ts first if I want it to work.
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
