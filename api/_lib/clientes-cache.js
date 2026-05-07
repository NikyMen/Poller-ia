const CACHE_TTL_MS = Number(process.env.CLIENTES_CACHE_TTL_MS || 5 * 60 * 1000);
const WAIT_TIMEOUT_MS = Number(process.env.CLIENTES_CALLBACK_TIMEOUT_MS || 12000);
const POLL_INTERVAL_MS = 300;

const state = globalThis.__polleriaClientesCache || {
  phones: null,
  updatedAt: 0
};

globalThis.__polleriaClientesCache = state;

function savePhones(phones) {
  state.phones = Array.isArray(phones) ? phones : [];
  state.updatedAt = Date.now();
  return getSnapshot();
}

function getCachedPhones(options = {}) {
  const { minUpdatedAt = 0, maxAgeMs = CACHE_TTL_MS } = options;
  if (!Array.isArray(state.phones)) return null;
  if (state.updatedAt < minUpdatedAt) return null;
  if (Date.now() - state.updatedAt > maxAgeMs) return null;
  return getSnapshot();
}

async function waitForCachedPhones(options = {}) {
  const timeoutMs = Number(options.timeoutMs || WAIT_TIMEOUT_MS);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const cached = getCachedPhones(options);
    if (cached) return cached;
    await delay(POLL_INTERVAL_MS);
  }

  return getCachedPhones(options);
}

function getSnapshot() {
  return {
    phones: [...state.phones],
    updatedAt: state.updatedAt
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  getCachedPhones,
  savePhones,
  waitForCachedPhones
};
