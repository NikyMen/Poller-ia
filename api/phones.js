const { requireSession, sendJson } = require('./_lib/auth');
const { getApiHeaders, getListMethod, getListUrl, normalizePhoneItem, pickArray } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  if (!requireSession(req, res)) return;

  const method = getListMethod();

  try {
    const response = await fetch(getListUrl(), {
      method,
      headers: getApiHeaders(),
      body: method === 'GET' ? undefined : JSON.stringify({ source: 'poller-ia-panel' })
    });

    const json = await response.json();
    if (!response.ok) {
      return sendJson(res, response.status, { error: 'Error al consultar telefonos', detail: json });
    }

    const phones = pickArray(json)
      .map(normalizePhoneItem)
      .filter((item) => item.phone);

    return sendJson(res, 200, { phones });
  } catch (error) {
    return sendJson(res, 502, { error: 'No se pudo consultar la API', detail: error.message });
  }
};
