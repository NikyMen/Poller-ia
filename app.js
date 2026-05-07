const state = {
  phones: []
};

const logoutBtn = document.querySelector('#logoutBtn');
const refreshBtn = document.querySelector('#refreshBtn');
const manualForm = document.querySelector('#manualForm');
const manualPhone = document.querySelector('#manualPhone');
const searchInput = document.querySelector('#searchInput');
const statusMessage = document.querySelector('#statusMessage');
const phonesList = document.querySelector('#phonesList');

init();

async function init() {
  const session = await api('/api/session');
  if (!session.authenticated) {
    window.location.replace('/');
    return;
  }
  loadPhones();
}

logoutBtn.addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  window.location.replace('/');
});

refreshBtn.addEventListener('click', loadPhones);
searchInput.addEventListener('input', renderPhones);

manualForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const phone = manualPhone.value.trim();
  if (!phone) return;
  await setAi(phone, false);
  manualPhone.value = '';
});

async function loadPhones() {
  setStatus('Cargando telefonos...');
  refreshBtn.disabled = true;

  try {
    const data = await api('/api/phones');
    state.phones = data.phones || [];
    renderPhones();
    setStatus(state.phones.length ? `${state.phones.length} telefonos encontrados.` : 'No hay telefonos para mostrar.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    refreshBtn.disabled = false;
  }
}

function renderPhones() {
  const query = searchInput.value.trim().toLowerCase();
  const phones = state.phones.filter((item) => {
    const rawText = JSON.stringify(item.raw || {}).toLowerCase();
    return !query || item.phone.toLowerCase().includes(query) || (item.name || '').toLowerCase().includes(query) || rawText.includes(query);
  });

  phonesList.innerHTML = '';

  if (!phones.length) {
    phonesList.innerHTML = '<div class="status">Sin resultados.</div>';
    return;
  }

  for (const item of phones) {
    const row = document.createElement('article');
    row.className = 'phone-row';

    const statusClass = item.aiEnabled ? 'on' : 'off';
    const actionText = item.aiEnabled ? 'Desactivar IA' : 'IA desactivada';

    row.innerHTML = `
      <div class="phone-main">
        <p class="phone-number"></p>
        <p class="phone-name"></p>
        <dl class="phone-details"></dl>
      </div>
      <span class="badge ${statusClass}">${item.aiEnabled ? 'IA activa' : 'IA pausada'}</span>
      <button class="deactivate-btn" type="button">${actionText}</button>
    `;

    row.querySelector('.phone-number').textContent = item.phone;
    row.querySelector('.phone-name').textContent = item.name || 'Sin nombre';
    renderDetails(row.querySelector('.phone-details'), item);
    const button = row.querySelector('.deactivate-btn');
    button.disabled = !item.aiEnabled;
    button.addEventListener('click', () => setAi(item, false));
    phonesList.appendChild(row);
  }
}

function renderDetails(container, item) {
  const skipKeys = new Set([
    'phone', 'telefono', 'number', 'numero', 'whatsapp',
    'name', 'nombre', 'customer', 'cliente',
    'aiEnabled', 'iaActiva', 'botEnabled', 'botActivo',
    'enabled', 'active', 'activo'
  ]);

  const entries = Object.entries(item.raw || {})
    .filter(([key, value]) => !skipKeys.has(key) && value !== null && value !== undefined && value !== '')
    .slice(0, 8);

  container.innerHTML = '';
  for (const [key, value] of entries) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = formatLabel(key);
    description.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value);
    container.append(term, description);
  }
}

function formatLabel(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

async function setAi(target, aiEnabled) {
  const phone = typeof target === 'object' ? target.phone : String(target);
  const raw = typeof target === 'object' ? (target.raw || {}) : {};

  setStatus(`${aiEnabled ? 'Activando' : 'Desactivando'} IA para ${phone}...`);

  try {
    await api('/api/toggle-ai', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        telefono: raw.telefono || phone,
        lead_id: raw.lead_id,
        aiEnabled,
        bot_desactivado: !aiEnabled
      })
    });
    const existing = state.phones.find((item) => item.phone === phone);
    if (existing) {
      existing.aiEnabled = aiEnabled;
    } else {
      state.phones.unshift({ phone, name: 'Agregado manualmente', aiEnabled });
    }
    renderPhones();
    setStatus(`IA ${aiEnabled ? 'activada' : 'desactivada'} para ${phone}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? 'var(--danger)' : 'var(--muted)';
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Ocurrio un error');
  }
  return data;
}
