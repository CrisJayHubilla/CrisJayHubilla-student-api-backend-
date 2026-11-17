'use strict';

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const connectToDatabase = require('./db');
const { applyCors } = require('./cors');
const { readBody, getId, sendError } = require('./http');

async function getAttendanceCollection() {
  const db = mongoose.connection.db;
  const configuredName = process.env.MONGODB_ATTENDANCE_COLLECTION || process.env.MONGODB_COLLECTION;

  const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((item) => item.name)
    .filter((name) => !name.startsWith('system.'));

  if (configuredName) {
    if (!collectionNames.includes(configuredName)) {
      throw new Error(`Configured attendance collection \"${configuredName}\" was not found in database \"${mongoose.connection.name}\". Existing collections: ${collectionNames.join(', ') || '(none)'}. Set MONGODB_ATTENDANCE_COLLECTION to the exact existing attendance collection name.`);
    }
    return db.collection(configuredName);
  }
  const attendanceMatches = collectionNames.filter((name) => /attend/i.test(name));

  if (attendanceMatches.length === 1) return db.collection(attendanceMatches[0]);
  if (attendanceMatches.length > 1) {
    const exact = attendanceMatches.find((name) => name.toLowerCase() === 'attendance');
    if (exact) return db.collection(exact);
    throw new Error(`More than one attendance collection was found (${attendanceMatches.join(', ')}). Set MONGODB_ATTENDANCE_COLLECTION to the exact collection name.`);
  }

  throw new Error(`No attendance collection was detected in database "${mongoose.connection.name}". Existing collections: ${collectionNames.join(', ') || '(none)'}. Set MONGODB_ATTENDANCE_COLLECTION to the exact existing collection name.`);
}

function mongoId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)
    ? new ObjectId(id)
    : id;
}

function preserveExistingTypes(body, existing) {
  const result = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (['_id', '__v'].includes(key)) continue;
    const sample = existing ? existing[key] : undefined;
    if (sample instanceof Date && typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
      result[key] = new Date(value);
    } else if (typeof sample === 'number' && typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = async function attendanceHandler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await connectToDatabase();

    if (req.method === 'GET' && req.query && req.query.info) {
      const collection = await getAttendanceCollection();
      const collections = (await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name);
      return res.status(200).json({
        database: mongoose.connection.name,
        attendanceCollection: collection.collectionName,
        collections,
      });
    }

    const collection = await getAttendanceCollection();
    const id = getId(req);

    if (req.method === 'GET') {
      if (id) {
        const record = await collection.findOne({ _id: mongoId(id) });
        if (!record) return res.status(404).json({ error: 'Attendance record not found.' });
        return res.status(200).json(record);
      }
      return res.status(200).json(await collection.find({}).sort({ _id: -1 }).toArray());
    }

    if (req.method === 'POST') {
      const body = readBody(req);
      if (!body || Array.isArray(body) || typeof body !== 'object') {
        return res.status(400).json({ error: 'Request body must be a JSON object.' });
      }
      const sample = await collection.findOne({});
      const document = preserveExistingTypes(body, sample);
      const result = await collection.insertOne(document);
      return res.status(201).json({ ...document, _id: result.insertedId });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'Attendance record ID is required.' });
      const existing = await collection.findOne({ _id: mongoId(id) });
      if (!existing) return res.status(404).json({ error: 'Attendance record not found.' });
      const body = readBody(req);
      if (!body || Array.isArray(body) || typeof body !== 'object') {
        return res.status(400).json({ error: 'Request body must be a JSON object.' });
      }
      await collection.updateOne({ _id: existing._id }, { $set: preserveExistingTypes(body, existing) });
      return res.status(200).json(await collection.findOne({ _id: existing._id }));
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Attendance record ID is required.' });
      const result = await collection.deleteOne({ _id: mongoId(id) });
      if (!result.deletedCount) return res.status(404).json({ error: 'Attendance record not found.' });
      return res.status(200).json({ deleted: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return sendError(res, error, 'Attendance API error:');
  }
};
