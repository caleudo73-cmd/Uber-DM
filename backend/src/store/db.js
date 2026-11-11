// Base de datos en memoria (se reinicia al apagar el servidor).
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const users = new Map();
const rides = new Map();
const refreshTokens = new Set();

const seedUser = (id, name, email, role) =>
  users.set(id, {
    id,
    name,
    email,
    role,
    passwordHash: bcrypt.hashSync('123456', 8),
  });

seedUser('u-1', 'Pasajero Demo', 'pasajero@demo.com', ROLES.PASSENGER);
seedUser('u-2', 'Conductor Demo', 'conductor@demo.com', ROLES.DRIVER);

module.exports = { users, rides, refreshTokens };
