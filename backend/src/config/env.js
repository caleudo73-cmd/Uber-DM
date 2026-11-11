module.exports = {
  PORT: process.env.PORT || 4000,
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  ACCESS_EXPIRES_IN: '15m',
  REFRESH_EXPIRES_IN: '7d',
};
