const { verifyAccess } = require('../services/tokenService');
const { users } = require('../store/db');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  try {
    const payload = verifyAccess(token);
    const user = users.get(payload.sub);
    if (!user) return res.status(401).json({ message: 'Usuario no existe' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const requireRole = (role) => (req, res, next) =>
  req.user.role === role
    ? next()
    : res.status(403).json({ message: 'No tienes permiso para esta acción' });

module.exports = { authenticate, requireRole };
