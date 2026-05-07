const { sendJson } = require('./_lib/auth');
const { savePhones } = require('./_lib/clientes-cache');
const { normalizePhoneItem, pickArray, readJson } = require('./_lib/upstream');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: 'No autorizado' });
  }

  try {
    const body = await readJson(req);
    const phones = pickArray(body)
      .map(normalizePhoneItem)
      .filter((item) => item.phone);
    savePhones(phones);

    return sendJson(res, 200, {
      ok: true,
      count: phones.length,
      phones
    });
  } catch (error) {
    return sendJson(res, 400, { error: 'JSON invalido', detail: error.message });
  }
};

function isAuthorized(req) {
  const expectedKey = process.env.CLIENTES_BOT_API_KEY;
  if (!expectedKey) return true;

  const apiKey = req.headers['x-api-key'];
  const authorization = req.headers.authorization || '';
  return apiKey === expectedKey || authorization === `Bearer ${expectedKey}`;
}
