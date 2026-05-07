const { requireSession, sendJson } = require('./_lib/auth');
const { getApiHeaders, readJson } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  if (!requireSession(req, res)) return;

  const url = process.env.API_TOGGLE_URL;
  if (!url) {
    return sendJson(res, 500, { error: 'Falta API_TOGGLE_URL' });
  }

  try {
    const { phone, aiEnabled } = await readJson(req);
    if (!phone) return sendJson(res, 400, { error: 'Falta telefono' });

    const response = await fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        phone: String(phone).trim(),
        aiEnabled: Boolean(aiEnabled)
      })
    });

    const text = await response.text();
    const detail = text ? safeJson(text) : null;

    if (!response.ok) {
      return sendJson(res, response.status, { error: 'No se pudo actualizar la IA', detail });
    }

    return sendJson(res, 200, { ok: true, detail });
  } catch (error) {
    return sendJson(res, 502, { error: 'No se pudo llamar a la API', detail: error.message });
  }
};

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
