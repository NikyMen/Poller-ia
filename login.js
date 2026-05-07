const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');

init();

async function init() {
  const session = await api('/api/session');
  if (session.authenticated) {
    window.location.replace('/panel');
  }
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
    window.location.assign('/panel');
  } catch (error) {
    loginError.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

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
