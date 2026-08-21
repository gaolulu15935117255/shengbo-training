const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

function signUserToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function verifyUserToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

function signAdminToken(payload) {
  return jwt.sign(payload, config.adminJwt.secret, { expiresIn: config.adminJwt.expiresIn });
}

function verifyAdminToken(token) {
  return jwt.verify(token, config.adminJwt.secret);
}

function getExpiresInSeconds(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn;
  const match = /^(\d+)([dhms])$/.exec(expiresIn);
  if (!match) return 2592000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const map = { d: 86400, h: 3600, m: 60, s: 1 };
  return n * (map[unit] || 86400);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = {
  signUserToken,
  verifyUserToken,
  signAdminToken,
  verifyAdminToken,
  getExpiresInSeconds,
  hashToken,
};
