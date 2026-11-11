const { rides } = require('../store/db');
const { RIDE_STATUS } = require('../config/constants');

// Destinos con nombre a los que más ha viajado el usuario (sin contar cancelados).
const frequentDestinations = (user, limit = 3) => {
  const groups = new Map();

  for (const ride of rides.values()) {
    if (ride.passengerId !== user.id || ride.status === RIDE_STATUS.CANCELLED) continue;
    const { name, latitude, longitude } = ride.destination;
    if (!name) continue;

    const key = `${name}|${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const group = groups.get(key) || { id: `freq-${key}`, name, latitude, longitude, trips: 0 };
    group.trips += 1;
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => b.trips - a.trips)
    .slice(0, limit)
    .map(({ trips, ...place }) => ({ ...place, address: trips === 1 ? '1 viaje' : `${trips} viajes` }));
};

module.exports = { frequentDestinations };