const state = {
  phones: []
};

const logoutBtn = document.querySelector('#logoutBtn');
const refreshBtn = document.querySelector('#refreshBtn');
const shutdownSalesBotBtn = document.querySelector('#shutdownSalesBotBtn');
const shutdownModal = document.querySelector('#shutdownModal');
let shutdownCountdown = document.querySelector('#shutdownCountdown');
const shutdownMessage = document.querySelector('#shutdownMessage');
const cancelShutdownBtn = document.querySelector('#cancelShutdownBtn');
const confirmShutdownBtn = document.querySelector('#confirmShutdownBtn');
const searchInput = document.querySelector('#searchInput');
const statusMessage = document.querySelector('#statusMessage');
const phonesList = document.querySelector('#phonesList');
let shutdownTimer = null;
let shutdownSecondsLeft = 5;

const icons = {
  phone: '<svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92z"/></svg>',
  lead: '<svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm4 3h10M7 12h10M7 16h6"/></svg>'
};

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
shutdownSalesBotBtn.addEventListener('click', openShutdownModal);
cancelShutdownBtn.addEventListener('click', closeShutdownModal);
confirmShutdownBtn.addEventListener('click', shutdownSalesBot);
searchInput.addEventListener('input', renderPhones);

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
    const formattedPhone = formatPhone(item.phone).toLowerCase();
    const leadText = formatLead(item).toLowerCase();
    return !query || item.phone.toLowerCase().includes(query) || formattedPhone.includes(query) || leadText.includes(query);
  });

  phonesList.innerHTML = '';

  if (!phones.length) {
    phonesList.innerHTML = '<div class="status">Sin resultados.</div>';
    return;
  }

  for (const item of phones) {
    const statusClass = item.aiEnabled ? 'on' : 'off';
    const actionText = item.aiEnabled ? 'Desactivar IA' : 'IA desactivada';
    const row = document.createElement('article');
    row.className = `phone-row ${statusClass}`;
    row.dataset.phone = item.phone;

    row.innerHTML = `
      <div class="phone-main">
        <p class="phone-number">${icons.phone}<span class="phone-value"></span></p>
        <p class="phone-lead">${icons.lead}<span class="lead-value"></span></p>
      </div>
      <div class="phone-status">
        <span class="badge ${statusClass}">${item.aiEnabled ? 'IA activa' : 'IA pausada'}</span>
      </div>
      <div class="phone-actions">
        <button class="deactivate-btn" type="button">${actionText}</button>
      </div>
    `;

    row.querySelector('.phone-value').textContent = formatPhone(item.phone);
    row.querySelector('.lead-value').textContent = formatLead(item);
    const button = row.querySelector('.deactivate-btn');
    button.disabled = !item.aiEnabled;
    button.addEventListener('click', () => setAi(item, false));
    phonesList.appendChild(row);
  }
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return String(phone || '');

  let local = digits;
  let prefix = '';

  if (local.startsWith('54')) {
    prefix = '+54';
    local = local.slice(2);
  } else if (local.length === 10) {
    prefix = '+54';
  }

  if (prefix && local.length === 11 && local.startsWith('9')) {
    local = local.slice(1);
  }

  if (prefix && local.length === 10) {
    return `${prefix} ${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }

  return prefix ? `${prefix} ${local}` : digits;
}

function formatLead(item) {
  const lead = getLeadValue(item);
  return lead === null || lead === undefined || lead === '' ? 'Lead: sin asignar' : `Lead: ${lead}`;
}

function getLeadValue(item) {
  const raw = item.raw || {};
  return item.lead_id
    ?? item.leadId
    ?? item.lead
    ?? raw.lead_id
    ?? raw.leadId
    ?? raw.lead
    ?? raw.raw?.lead_id
    ?? raw.raw?.leadId
    ?? raw.raw?.lead;
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
        lead_id: getLeadValue(target),
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

function openShutdownModal() {
  shutdownSecondsLeft = 5;
  shutdownCountdown.textContent = shutdownSecondsLeft;
  shutdownMessage.innerHTML = 'El boton final se habilitara en <strong id="shutdownCountdown">5</strong> segundos.';
  shutdownCountdown = document.querySelector('#shutdownCountdown');
  confirmShutdownBtn.disabled = true;
  cancelShutdownBtn.disabled = false;
  shutdownModal.hidden = false;
  shutdownSalesBotBtn.disabled = true;
  setStatus('Preparando apagado del bot de ventas...');

  shutdownTimer = setInterval(() => {
    shutdownSecondsLeft -= 1;
    shutdownCountdown.textContent = shutdownSecondsLeft;

    if (shutdownSecondsLeft <= 0) {
      clearInterval(shutdownTimer);
      shutdownTimer = null;
      confirmShutdownBtn.disabled = false;
      shutdownMessage.textContent = 'Ya podes confirmar el apagado del bot de ventas.';
      confirmShutdownBtn.focus();
    }
  }, 1000);
}

function closeShutdownModal() {
  if (shutdownTimer) {
    clearInterval(shutdownTimer);
    shutdownTimer = null;
  }

  shutdownModal.hidden = true;
  shutdownSalesBotBtn.disabled = false;
  confirmShutdownBtn.disabled = true;
  cancelShutdownBtn.disabled = false;
  setStatus('Apagado del bot de ventas cancelado.');
}

async function shutdownSalesBot() {
  setStatus('Ejecutando apagado del bot de ventas...');
  confirmShutdownBtn.disabled = true;
  cancelShutdownBtn.disabled = true;

  try {
    await api('/api/apagar-bot', {
      method: 'POST',
      body: JSON.stringify({
        bot_desactivado: true,
        salesBotEnabled: false
      })
    });

    for (const item of state.phones) {
      item.aiEnabled = false;
      item.raw = { ...(item.raw || {}), bot_desactivado: true };
    }
    renderPhones();
    shutdownModal.hidden = true;
    setStatus('Bot de ventas apagado.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    cancelShutdownBtn.disabled = false;
    shutdownSalesBotBtn.disabled = false;
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
