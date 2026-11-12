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
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  course: { type: String, required: true },
  year: { type: Number, default: 1 },
  email: { type: String, required: true }
}));

const wrap = fn => async (req, res) => {
  try { await connectDB(); await fn(req, res); }
  catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
};

app.get('/', (req, res) => res.send('Student API is running'));

app.get('/api', wrap(async (req, res) => res.json(await Student.find().sort({ createdAt: 1, _id: 1 }))));

app.post('/api', wrap(async (req, res) => res.status(201).json(await Student.create(req.body))));

app.put('/api/:id', wrap(async (req, res) => {
  const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ error: 'Student not found' });
  res.json(updated);
}));

app.delete('/api/:id', wrap(async (req, res) => {
  const removed = await Student.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Student not found' });
  res.json({ deleted: true });
}));

module.exports = app;
