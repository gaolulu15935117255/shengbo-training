const config = require('../config');

function getPublicBaseUrl(req) {
  if (config.publicBaseUrl) return config.publicBaseUrl;
  const proto = String(req.get('x-forwarded-proto') || req.protocol || 'https')
    .split(',')[0]
    .trim();
  const host = String(req.get('x-forwarded-host') || req.get('host') || '')
    .split(',')[0]
    .trim();
  if (host) return `${proto}://${host}`;
  return 'https://api.yanmakeji.top';
}

function toPublicUrl(req, pathname) {
  if (!pathname) return null;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getPublicBaseUrl(req)}${path}`;
}

function sanitizeNickName(value) {
  if (value == null) return null;
  const nick = String(value).trim();
  if (!nick) return null;
  return nick.slice(0, 64);
}

function sanitizeAvatarUrl(value) {
  if (value == null) return null;
  const url = String(value).trim();
  if (!/^https?:\/\//i.test(url)) return null;
  if (url.length > 512) return null;
  return url;
}

function sanitizeGender(value) {
  const gender = parseInt(value, 10);
  if (gender === 1 || gender === 2) return gender;
  return null;
}

module.exports = {
  getPublicBaseUrl,
  toPublicUrl,
  sanitizeNickName,
  sanitizeAvatarUrl,
  sanitizeGender,
};
