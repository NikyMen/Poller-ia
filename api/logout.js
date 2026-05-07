const { clearSessionCookie, sendJson } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  res.setHeader('Set-Cookie', clearSessionCookie());
  return sendJson(res, 200, { ok: true });
};
