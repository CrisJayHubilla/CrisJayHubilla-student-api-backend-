const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Reuse the connection between serverless invocations
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const Record = mongoose.models.Record || mongoose.model('Record',
  new mongoose.Schema({ title: String, content: String }));

app.get('/', (req, res) => res.send('API is running'));

app.get('/api', async (req, res) => {
  try {
    await connectDB();
    res.json(await Record.find());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api', async (req, res) => {
  try {
    await connectDB();
    const record = await Record.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
