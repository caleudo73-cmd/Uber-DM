const { ROLES } = require('../config/constants');

const involves = (ride, user) => ride.passengerId === user.id || ride.driverId === user.id;

const myRides = (rides, user) => [...rides.values()].filter((ride) => involves(ride, user));

// Calificación que recibe el usuario (todavía no existen, devuelve null hasta que se agreguen).
const receivedRating = (ride, user) => {
  const field = user.role === ROLES.PASSENGER ? 'byDriver' : 'byPassenger';
  const value = ride.ratings?.[field];
  return value > 0 ? value : null;
};

module.exports = { involves, myRides, receivedRating };