'use strict';
require('dotenv').config();
const express = require('express');
const studentHandler = require('./lib/student-handler');
const attendanceHandler = require('./lib/attendance-handler');
const healthHandler = require('./api/health');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ ok: true, message: 'Student and Attendance API is running.' }));
app.all('/api/health', healthHandler);
app.all('/api', studentHandler);
app.all('/api/students', studentHandler);
app.all('/api/students/:id', studentHandler);
app.all('/api/attendance', attendanceHandler);
app.all('/api/attendance/:id', attendanceHandler);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening at http://localhost:${port}`));
