'use strict';

const mongoose = require('mongoose');
const connectToDatabase = require('./db');
const { applyCors, handleOptions } = require('./cors');
const { readBody, getId, sendError } = require('./http');

function getStudentModel() {
  const collectionName = process.env.MONGODB_STUDENT_COLLECTION || 'students';
  const schema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    studentId: { type: String, required: true, trim: true, maxlength: 30 },
    course: { type: String, required: true, trim: true, maxlength: 100 },
    year: { type: Number, default: 1, min: 1, max: 8 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  }, { timestamps: true, strict: true });

  return mongoose.models.Student || mongoose.model('Student', schema, collectionName);
}

module.exports = async function studentHandler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await connectToDatabase();
    const Student = getStudentModel();
    const id = getId(req);

    if (req.method === 'GET') {
      if (id) {
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid student record ID.' });
        const record = await Student.findById(id).lean();
        if (!record) return res.status(404).json({ error: 'Student not found.' });
        return res.status(200).json(record);
      }
      const records = await Student.find({}).sort({ createdAt: -1, _id: -1 }).lean();
      return res.status(200).json(records);
    }

    if (req.method === 'POST') {
      const body = readBody(req);
      if (!body || Array.isArray(body) || typeof body !== 'object') {
        return res.status(400).json({ error: 'Request body must be a JSON object.' });
      }
      delete body._id;
      delete body.__v;
      const created = await Student.create(body);
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'Student record ID is required.' });
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid student record ID.' });
      const body = readBody(req);
      if (!body || Array.isArray(body) || typeof body !== 'object') {
        return res.status(400).json({ error: 'Request body must be a JSON object.' });
      }
      delete body._id;
      delete body.__v;
      const updated = await Student.findByIdAndUpdate(id, { $set: body }, {
        new: true,
        runValidators: true,
      }).lean();
      if (!updated) return res.status(404).json({ error: 'Student not found.' });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Student record ID is required.' });
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid student record ID.' });
      const deleted = await Student.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ error: 'Student not found.' });
      return res.status(200).json({ deleted: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return sendError(res, error, 'Student API error:');
  }
};
