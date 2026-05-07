const { requireSession, sendJson } = require('./_lib/auth');
const { getApiHeaders, readJson } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  if (!requireSession(req, res)) return;

  const url = process.env.API_APAGAR_BOT_URL || 'https://n8n.srv1224751.hstgr.cloud/webhook/apagar_bot';

  try {
    const body = await readJson(req);
    const phone = String(body.phone || body.telefono || '').trim();
    const payload = {
      bot_desactivado: true,
      salesBotEnabled: false
    };

    if (phone) {
      payload.phone = phone;
      payload.telefono = phone;
      payload.lead_id = body.lead_id;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    const detail = text ? safeJson(text) : null;

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: response.status === 404
          ? 'No se encontro el webhook apagar_bot en n8n'
          : 'No se pudo apagar el bot de ventas',
        detail
      });
    }

    return sendJson(res, 200, { ok: true, detail });
  } catch (error) {
    return sendJson(res, 502, { error: 'No se pudo llamar a n8n', detail: error.message });
  }
};

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
