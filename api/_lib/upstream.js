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

function getListUrl() {
  return process.env.API_LIST_URL || 'https://n8n.srv1224751.hstgr.cloud/webhook/db-polleria';
}

function getListMethod() {
  return String(process.env.API_LIST_METHOD || 'POST').toUpperCase();
}

function pickArray(json) {
  if (Array.isArray(json)) return json;

  const value = json.data || json.items || json.rows || json.records || json.phones || json.telefonos || json.body;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : pickArray(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

function firstValue(item, keys) {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key];
  }
  return '';
}

function normalizePhoneItem(item) {
  const source = item && typeof item.json === 'object' ? item.json : item;
  const phone = String(firstValue(source, ['phone', 'telefono', 'telefono_cliente', 'celular', 'number', 'numero', 'whatsapp'])).trim();
  const name = String(firstValue(source, ['name', 'nombre', 'customer', 'cliente'])).trim();
  const aiValue = firstValue(source, ['aiEnabled', 'iaActiva', 'ia_activa', 'botEnabled', 'botActivo', 'bot_activo', 'enabled', 'active', 'activo']);

  return {
    phone,
    name,
    aiEnabled: parseBoolean(aiValue),
    raw: source
  };
}

function parseBoolean(value) {
  if (value === '') return true;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'no', 'off', 'inactivo', 'pausado', 'desactivado'].includes(normalized)) return false;
  return true;
}

module.exports = {
  getApiHeaders,
  getListMethod,
  getListUrl,
  normalizePhoneItem,
  pickArray,
  readJson
};
