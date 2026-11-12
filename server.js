// server.js - local development server (uses the same handler as Vercel)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handler = require('./api/attendance');

const app = express();
app.use(cors());
app.use(express.json());
app.all('/api/attendance', handler);
app.all('/api/attendance/:id', (req, res) => {
  req.query.id = req.params.id;
  return handler(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Local server running on http://localhost:${PORT}/api/attendance`));
