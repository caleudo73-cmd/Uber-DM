const router = require('express').Router();
const { rides } = require('../store/db');
const { RIDE_STATUS } = require('../config/constants');
const { authenticate } = require('../middleware/auth');
const { myRides, receivedRating } = require('../services/rideHelpers');

router.get('/me/stats', authenticate, (req, res) => {
  const { id, name, email, role } = req.user;
  const mine = myRides(rides, req.user);
  const completed = mine.filter((ride) => ride.status === RIDE_STATUS.COMPLETED);
  const cancelled = mine.filter((ride) => ride.status === RIDE_STATUS.CANCELLED);

  const received = completed.map((ride) => receivedRating(ride, req.user)).filter(Boolean);
  const rating = received.length
    ? +(received.reduce((sum, value) => sum + value, 0) / received.length).toFixed(1)
    : null;

  res.json({
    user: { id, name, email, role },
    stats: {
      rating,
      ratingCount: received.length,
      completedRides: completed.length,
      cancelledRides: cancelled.length,
    },
  });
});

module.exports = router;