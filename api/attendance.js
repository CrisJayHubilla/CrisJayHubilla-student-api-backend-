// api/attendance.js - Vercel serverless function (full CRUD on YOUR existing records)
// Reads the real collection in LabAttendanceDB, whatever its field names are.
const mongoose = require('mongoose');
const connectToDatabase = require('../db');

const { ObjectId } = mongoose.Types;
const SKIP_ON_WRITE = ['_id', '__v'];
let detectedName = null;

// Which collection holds the attendance records?
// 1) MONGODB_COLLECTION env var if set  2) otherwise auto-detect
async function getCollection() {
  const db = mongoose.connection.db;
  if (process.env.MONGODB_COLLECTION) return db.collection(process.env.MONGODB_COLLECTION);

  if (!detectedName) {
    const names = (await db.listCollections().toArray())
      .map((c) => c.name)
      .filter((n) => !n.startsWith('system.'));
    const withDocs = [];
    for (const n of names) {
      if ((await db.collection(n).estimatedDocumentCount()) > 0) withDocs.push(n);
    }
    const pool = withDocs.length ? withDocs : names;
    detectedName = pool.find((n) => /attend/i.test(n)) || pool[0];
  }
  if (!detectedName) throw new Error('No collections found in the database');
  return db.collection(detectedName);
}

function toId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : id;
}

// Keep the same data types your records already use (Date stays Date, number stays number)
function coerce(body, sample) {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (SKIP_ON_WRITE.includes(k)) continue;
    const s = sample ? sample[k] : undefined;
    if (s instanceof Date && typeof v === 'string' && !isNaN(new Date(v))) out[k] = new Date(v);
    else if (typeof s === 'number' && typeof v === 'string' && v.trim() !== '' && !isNaN(v)) out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await connectToDatabase();

    // Debug helper: /api/attendance?info=1 shows which collection is being used
    if (req.query.info) {
      const all = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
      const col = await getCollection();
      return res.status(200).json({ database: mongoose.connection.name, using: col.collectionName, collections: all });
    }

    const col = await getCollection();
    const { id } = req.query;

    switch (req.method) {
      case 'GET': {
        if (id) {
          const doc = await col.findOne({ _id: toId(id) });
          if (!doc) return res.status(404).json({ error: 'Record not found' });
          return res.status(200).json(doc);
        }
        return res.status(200).json(await col.find({}).sort({ _id: -1 }).toArray());
      }

      case 'POST': {
        const sample = await col.findOne({});
        const doc = coerce(req.body, sample);
        const r = await col.insertOne(doc);
        return res.status(201).json({ ...doc, _id: r.insertedId });
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) return res.status(400).json({ error: 'id is required' });
        const existing = await col.findOne({ _id: toId(id) });
        if (!existing) return res.status(404).json({ error: 'Record not found' });
        await col.updateOne({ _id: existing._id }, { $set: coerce(req.body, existing) });
        return res.status(200).json(await col.findOne({ _id: existing._id }));
      }

      case 'DELETE': {
        if (!id) return res.status(400).json({ error: 'id is required' });
        const r = await col.deleteOne({ _id: toId(id) });
        if (!r.deletedCount) return res.status(404).json({ error: 'Record not found' });
        return res.status(200).json({ deleted: true });
      }

      default:
        res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database operation failed', detail: e.message });
  }
};
