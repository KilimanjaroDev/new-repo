async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();

    const healthEl = document.getElementById('health-status');
    healthEl.textContent = `Status: ${data.status} | App: ${data.app}`;
  } catch (error) {
    document.getElementById('health-status').textContent = 'Connection failed. Check backend server.';
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const input = document.getElementById('message-input');
  const responseEl = document.getElementById('message-response');
  const message = input.value.trim();

  if (!message) {
    responseEl.textContent = 'Please enter a message first.';
    return;
  }

  try {
    const response = await fetch('/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    responseEl.textContent = `Success: ${data.message}`;
    input.value = '';
  } catch (error) {
    responseEl.textContent = `Error: ${error.message}`;
  }
}

document.getElementById('message-form').addEventListener('submit', handleSubmit);
checkHealth();
