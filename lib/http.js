'use strict';

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return null; }
  }
  return {};
}

function getId(req) {
  const queryId = req.query && (req.query.id || req.query.studentId);
  const routeId = req.params && req.params.id;
  return routeId || queryId || null;
}

function sendError(res, error, context) {
  console.error(context, error);
  if (error && error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  if (error && error.code === 11000) {
    return res.status(409).json({ error: 'A record with that unique value already exists.' });
  }
  const message = error && error.message ? error.message : 'Unexpected server error';
  return res.status(500).json({ error: message });
}

module.exports = { readBody, getId, sendError };
