const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { searchPlaces, searchNearby } = require('../services/placesService');
const { frequentDestinations } = require('../services/frequentPlaces');

router.use(authenticate);

const parseNear = ({ lat, lon }) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 3) return res.json({ places: [] });
  res.json({ places: await searchPlaces(query, parseNear(req.query)) });
});

router.get('/suggestions', async (req, res) => {
  const near = parseNear(req.query);
  res.json({
    frequent: frequentDestinations(req.user),
    nearby: near ? await searchNearby(near) : [],
  });
});

module.exports = router;