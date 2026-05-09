const { requireSession, sendJson } = require('./_lib/auth');
const { getApiHeaders, readJson } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  if (!requireSession(req, res)) return;

  try {
    const body = await readJson(req);
    const { phone, telefono, lead_id, aiEnabled } = body;
    const normalizedPhone = String(phone || telefono || '').trim();
    const enabled = Boolean(aiEnabled);
    const url = enabled
      ? (process.env.API_ACTIVAR_BOT_URL || 'https://n8n.srv1224751.hstgr.cloud/webhook/Activar_telefono_polleria')
      : process.env.API_TOGGLE_URL;

    if (!normalizedPhone) return sendJson(res, 400, { error: 'Falta telefono' });
    if (!url) return sendJson(res, 500, { error: 'Falta API_TOGGLE_URL' });

    const response = await fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        phone: normalizedPhone,
        telefono: normalizedPhone,
        lead_id,
        aiEnabled: enabled,
        bot_desactivado: !enabled
      })
    });

    const text = await response.text();
    const detail = text ? safeJson(text) : null;

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: response.status === 404
          ? `No se encontro el webhook de ${enabled ? 'activar' : 'desactivar'} IA en n8n`
          : 'No se pudo actualizar la IA',
        detail
      });
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
