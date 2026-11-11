const router = require('express').Router();
const crypto = require('crypto');
const { rides } = require('../store/db');
const { ROLES, RIDE_STATUS, ACTIVE_STATUSES, PRICING } = require('../config/constants');
const { authenticate, requireRole } = require('../middleware/auth');
const { distanceKm, calculatePrice } = require('../services/pricingService');

router.use(authenticate);

const isPoint = (p) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number';
const toPoint = (p) => ({
  latitude: p.latitude,
  longitude: p.longitude,
  name: typeof p.name === 'string' ? p.name.slice(0, 120) : null,
});
const all = () => [...rides.values()];
const isActive = (r) => ACTIVE_STATUSES.includes(r.status);

router.post('/quote', requireRole(ROLES.PASSENGER), (req, res) => {
  const { origin, destination } = req.body;
  if (!isPoint(origin) || !isPoint(destination)) {
    return res.status(400).json({ message: 'Origen y destino requeridos' });
  }
  const km = distanceKm(origin, destination);
  res.json({ distanceKm: +km.toFixed(2), price: calculatePrice(km), currency: PRICING.CURRENCY });
});

router.post('/', requireRole(ROLES.PASSENGER), (req, res) => {
  const { origin, destination } = req.body;
  if (!isPoint(origin) || !isPoint(destination)) {
    return res.status(400).json({ message: 'Origen y destino requeridos' });
  }
  if (all().some((r) => r.passengerId === req.user.id && isActive(r))) {
    return res.status(409).json({ message: 'Ya tienes un viaje activo' });
  }

  const km = distanceKm(origin, destination);
  const ride = {
    id: crypto.randomUUID(),
    passengerId: req.user.id,
    passengerName: req.user.name,
    driverId: null,
    driverName: null,
    origin: toPoint(origin),
    destination: toPoint(destination),
    distanceKm: +km.toFixed(2),
    price: calculatePrice(km),
    currency: PRICING.CURRENCY,
    paymentMethod: 'simulated',
    status: RIDE_STATUS.REQUESTED,
    createdAt: new Date().toISOString(),
  };
  rides.set(ride.id, ride);
  res.status(201).json({ ride });
});

router.get('/current', (req, res) => {
  const key = req.user.role === ROLES.DRIVER ? 'driverId' : 'passengerId';
  const ride = all().find((r) => r[key] === req.user.id && isActive(r));
  res.json({ ride: ride || null });
});

router.get('/available', requireRole(ROLES.DRIVER), (_req, res) => {
  res.json({ rides: all().filter((r) => r.status === RIDE_STATUS.REQUESTED) });
});

const driverTransition = (from, to) => (req, res) => {
  const ride = rides.get(req.params.id);
  if (!ride) return res.status(404).json({ message: 'Viaje no encontrado' });
  if (ride.status !== from) return res.status(409).json({ message: 'Estado inválido para esta acción' });

  if (from === RIDE_STATUS.REQUESTED) {
    if (all().some((r) => r.driverId === req.user.id && isActive(r))) {
      return res.status(409).json({ message: 'Ya tienes un viaje activo' });
    }
    ride.driverId = req.user.id;
    ride.driverName = req.user.name;
  } else if (ride.driverId !== req.user.id) {
    return res.status(403).json({ message: 'Este viaje no es tuyo' });
  }

  ride.status = to;
  res.json({ ride });
};

router.post('/:id/accept', requireRole(ROLES.DRIVER), driverTransition(RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED));
router.post('/:id/start', requireRole(ROLES.DRIVER), driverTransition(RIDE_STATUS.ACCEPTED, RIDE_STATUS.IN_PROGRESS));
router.post('/:id/complete', requireRole(ROLES.DRIVER), driverTransition(RIDE_STATUS.IN_PROGRESS, RIDE_STATUS.COMPLETED));

router.post('/:id/cancel', (req, res) => {
  const ride = rides.get(req.params.id);
  if (!ride) return res.status(404).json({ message: 'Viaje no encontrado' });
  const isOwner = ride.passengerId === req.user.id || ride.driverId === req.user.id;
  if (!isOwner) return res.status(403).json({ message: 'Este viaje no es tuyo' });
  if (![RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED].includes(ride.status)) {
    return res.status(409).json({ message: 'Ya no se puede cancelar' });
  }
  ride.status = RIDE_STATUS.CANCELLED;
  res.json({ ride });
});

module.exports = router;
