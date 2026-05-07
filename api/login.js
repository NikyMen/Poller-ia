const { createSessionCookie, sendJson } = require('./_lib/auth');
const { readJson } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  try {
    const { username, password } = await readJson(req);
    const expectedUser = process.env.DASHBOARD_USER;
    const expectedPassword = process.env.DASHBOARD_PASSWORD;

    if (!expectedUser || !expectedPassword) {
      return sendJson(res, 500, { error: 'Faltan DASHBOARD_USER o DASHBOARD_PASSWORD' });
    }

    if (username !== expectedUser || password !== expectedPassword) {
      return sendJson(res, 401, { error: 'Usuario o clave incorrectos' });
    }

    res.setHeader('Set-Cookie', createSessionCookie(username));
    return sendJson(res, 200, { ok: true });
  } catch {
    return sendJson(res, 400, { error: 'JSON invalido' });
  }
};
