const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { users } = require('../store/db');
const { ROLES } = require('../config/constants');
const { authenticate } = require('../middleware/auth');
const {
  issueTokens,
  verifyRefresh,
  revokeRefresh,
} = require('../services/tokenService');

const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });
const findByEmail = (email) =>
  [...users.values()].find((u) => u.email === String(email).toLowerCase());

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: 'Datos incompletos o rol inválido' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener mínimo 6 caracteres' });
  }
  if (findByEmail(email)) {
    return res.status(409).json({ message: 'Ese correo ya está registrado' });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    role,
    passwordHash: bcrypt.hashSync(password, 8),
  };
  users.set(user.id, user);
  res.status(201).json({ user: publicUser(user), ...issueTokens(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findByEmail(email);
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
  }
  res.json({ user: publicUser(user), ...issueTokens(user) });
});

router.post('/refresh', (req, res) => {
  try {
    const payload = verifyRefresh(req.body.refreshToken);
    const user = users.get(payload.sub);
    revokeRefresh(req.body.refreshToken);
    res.json(issueTokens(user));
  } catch {
    res.status(401).json({ message: 'Sesión expirada' });
  }
});

router.post('/logout', (req, res) => {
  revokeRefresh(req.body.refreshToken);
  res.status(204).end();
});

router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
