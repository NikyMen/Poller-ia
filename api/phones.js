const { requireSession, sendJson } = require('./_lib/auth');
const { getApiHeaders, normalizePhoneItem, pickArray } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  if (!requireSession(req, res)) return;

  const url = process.env.API_LIST_URL;
  if (!url) {
    return sendJson(res, 500, { error: 'Falta API_LIST_URL' });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders()
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
