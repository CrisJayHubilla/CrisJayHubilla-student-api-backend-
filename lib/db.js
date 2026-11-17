'use strict';

const mongoose = require('mongoose');

// Reuse one connection between Vercel serverless invocations.
const globalCache = globalThis.__studentAttendanceMongo || {
  connection: null,
  promise: null,
};
globalThis.__studentAttendanceMongo = globalCache;

async function connectToDatabase() {
  if (globalCache.connection && mongoose.connection.readyState === 1) {
    return globalCache.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it in Vercel Project Settings > Environment Variables.');
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'LabAttendanceDB',
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    }).then((connection) => connection).catch((error) => {
      globalCache.promise = null;
      throw error;
    });
  }

  globalCache.connection = await globalCache.promise;
  return globalCache.connection;
}

module.exports = connectToDatabase;
