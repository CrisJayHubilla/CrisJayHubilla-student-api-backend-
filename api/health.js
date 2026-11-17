'use strict';
const connectToDatabase = require('../lib/db');
const { applyCors } = require('../lib/cors');

module.exports = async function health(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    await connectToDatabase();
    return res.status(200).json({
      ok: true,
      message: 'Student and Attendance API is connected to MongoDB.',
      database: require('mongoose').connection.name,
      studentCollection: process.env.MONGODB_STUDENT_COLLECTION || 'students',
      attendanceCollection: process.env.MONGODB_ATTENDANCE_COLLECTION || process.env.MONGODB_COLLECTION || 'auto-detect attendance collection',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
