'use strict';

function applyCors(req, res) {
  const requestOrigin = req.headers && req.headers.origin;
  const configured = (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  // For a classroom/demo deployment, '*' is convenient. In production, set
  // CORS_ORIGINS to the exact frontend origins, separated by commas.
  if (configured.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && configured.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function handleOptions(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  return false;
}

module.exports = { applyCors, handleOptions };
