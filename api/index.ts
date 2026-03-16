import express from 'express';
const app = express();

app.get('/api/categories', (req, res) => {
  res.json({
    status: 'success',
    message: 'Simplified API is working',
    timestamp: new Date().toISOString()
  });
});

export default app;
