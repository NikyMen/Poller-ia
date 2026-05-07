async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function getApiHeaders() {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  if (process.env.API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.API_TOKEN}`;
  }

  return headers;
}

function pickArray(json) {
  if (Array.isArray(json)) return json;
  return json.data || json.items || json.phones || json.telefonos || [];
}

function firstValue(item, keys) {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key];
  }
  return '';
}

function normalizePhoneItem(item) {
  const phone = String(firstValue(item, ['phone', 'telefono', 'number', 'numero', 'whatsapp'])).trim();
  const name = String(firstValue(item, ['name', 'nombre', 'customer', 'cliente'])).trim();
  const aiValue = firstValue(item, ['aiEnabled', 'iaActiva', 'botEnabled', 'botActivo', 'enabled', 'active', 'activo']);

  return {
    phone,
    name,
    aiEnabled: aiValue === '' ? true : Boolean(aiValue),
    raw: item
  };
}

module.exports = {
  getApiHeaders,
  normalizePhoneItem,
  pickArray,
  readJson
};
