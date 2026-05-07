const { getSession, sendJson } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  const session = getSession(req);
  return sendJson(res, 200, {
    authenticated: Boolean(session),
    username: session ? session.username : null
  });
};
