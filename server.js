const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sampleData = {
  message: 'Welcome to your full-stack app!',
  timestamp: new Date().toISOString()
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'full-stack-app',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/message', (req, res) => {
  res.json(sampleData);
});

app.post('/api/message', (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'A non-empty message is required.' });
  }

  const response = {
    message: message.trim(),
    timestamp: new Date().toISOString()
  };

  return res.status(201).json(response);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
