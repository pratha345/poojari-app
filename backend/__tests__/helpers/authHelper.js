// __tests__/helpers/authHelper.js — Generate test JWT tokens
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, tenant_id: user.tenant_id ?? 1 },
    SECRET,
    { expiresIn: '1d' }
  );

const makeAdminToken  = (user) => makeToken({ ...user, role: 'admin' });
const makeUserToken   = (user) => makeToken({ ...user, role: 'user' });
const makePujariToken = (user) => makeToken({ ...user, role: 'pujari' });

const makeExpiredToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '-1s' });

module.exports = { makeToken, makeAdminToken, makeUserToken, makePujariToken, makeExpiredToken };
