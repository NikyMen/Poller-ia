const state = {
  phones: [],
  filtered: []
};

const loginView = document.querySelector('#loginView');
const appView = document.querySelector('#appView');
const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
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
  showView(session.authenticated);
  if (session.authenticated) loadPhones();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const button = loginForm.querySelector('button');
  button.disabled = true;

  try {
    await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: loginForm.username.value.trim(),
        password: loginForm.password.value
      })
    });
    loginForm.reset();
    showView(true);
    await loadPhones();
  } catch (error) {
    loginError.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  state.phones = [];
  renderPhones();
  showView(false);
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

function showView(isAuthenticated) {
  loginView.hidden = isAuthenticated;
  appView.hidden = !isAuthenticated;
}

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
    return !query || item.phone.toLowerCase().includes(query) || (item.name || '').toLowerCase().includes(query);
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
    const actionText = item.aiEnabled ? 'Desactivar IA' : 'Activar IA';
    const nextValue = !item.aiEnabled;

    row.innerHTML = `
      <div class="phone-main">
        <p class="phone-number"></p>
        <p class="phone-name"></p>
      </div>
      <span class="badge ${statusClass}">${item.aiEnabled ? 'IA activa' : 'IA pausada'}</span>
      <button class="toggle-btn ${item.aiEnabled ? 'off-action' : ''}" type="button">${actionText}</button>
    `;

    row.querySelector('.phone-number').textContent = item.phone;
    row.querySelector('.phone-name').textContent = item.name || 'Sin nombre';
    row.querySelector('.toggle-btn').addEventListener('click', () => setAi(item.phone, nextValue));
    phonesList.appendChild(row);
  }
}

async function setAi(phone, aiEnabled) {
  setStatus(`${aiEnabled ? 'Activando' : 'Desactivando'} IA para ${phone}...`);

  try {
    await api('/api/toggle-ai', {
      method: 'POST',
      body: JSON.stringify({ phone, aiEnabled })
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
