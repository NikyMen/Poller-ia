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
  return unwrapArray(json);
}

function unwrapArray(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const nested = pickNestedArray(item);
      return nested ? unwrapArray(nested, depth + 1) : [item];
    });
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return unwrapArray(parsed, depth + 1);
    } catch {
      return [];
    }
  }

  const nested = pickNestedArray(value);
  if (nested) return unwrapArray(nested, depth + 1);

  return [];
}

function pickNestedArray(item) {
  if (!item || typeof item !== 'object') return null;

  const source = item.json && typeof item.json === 'object' ? item.json : item;
  for (const key of ['data', 'items', 'rows', 'records', 'phones', 'telefonos', 'clientes', 'clients', 'body']) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  return null;
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
  const disabledValue = firstValue(source, ['bot_desactivado', 'botDesactivado', 'ia_desactivada', 'iaDesactivada', 'disabled', 'desactivado']);

  return {
    phone,
    name,
    aiEnabled: disabledValue === '' ? parseBoolean(aiValue) : !parseBoolean(disabledValue),
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
