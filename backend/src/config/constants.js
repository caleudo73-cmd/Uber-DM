const ROLES = { PASSENGER: 'passenger', DRIVER: 'driver' };

const RIDE_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ACTIVE_STATUSES = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.ACCEPTED,
  RIDE_STATUS.IN_PROGRESS,
];

const PRICING = { BASE_FARE: 4000, PER_KM: 1800, MIN_FARE: 7000, CURRENCY: 'COP' };

module.exports = { ROLES, RIDE_STATUS, ACTIVE_STATUSES, PRICING };
