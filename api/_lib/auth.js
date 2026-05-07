const crypto = require('crypto');

const COOKIE_NAME = 'polleria_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-only-change-this-secret';
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf('=');
      if (index === -1) return cookies;
      cookies[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function createSessionCookie(username) {
  const payload = base64url(JSON.stringify({
    username,
    exp: Date.now() + SESSION_TTL_MS
  }));
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureCookieFlag()}; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly${secureCookieFlag()}; SameSite=Strict; Max-Age=0`;
}

function secureCookieFlag() {
  return process.env.NODE_ENV === 'production' ? '; Secure' : '';
}

function getSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function requireSession(req, res) {
  const session = getSession(req);
  if (session) return session;
  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'No autorizado' }));
  return null;
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  getSession,
  requireSession,
  sendJson
};
