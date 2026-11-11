const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const { refreshTokens } = require('../store/db');

const payloadOf = (user) => ({ sub: user.id, role: user.role });

const issueTokens = (user) => {
  const accessToken = jwt.sign(payloadOf(user), env.ACCESS_SECRET, {
    expiresIn: env.ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payloadOf(user), env.REFRESH_SECRET, {
    expiresIn: env.REFRESH_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  });
  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken };
};

const verifyAccess = (token) => jwt.verify(token, env.ACCESS_SECRET);

const verifyRefresh = (token) => {
  if (!refreshTokens.has(token)) throw new Error('Refresh token revocado');
  return jwt.verify(token, env.REFRESH_SECRET);
};

const revokeRefresh = (token) => refreshTokens.delete(token);

module.exports = { issueTokens, verifyAccess, verifyRefresh, revokeRefresh };
