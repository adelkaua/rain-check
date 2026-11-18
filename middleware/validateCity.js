// Custom middleware #2: validates user input BEFORE any API call is made.
// Works for POST /search (req.body.city) and GET /forecast (req.query.city).
const CITY_PATTERN = /^[\p{L}\s.'-]+$/u; // letters (any language), spaces, dot, apostrophe, hyphen

module.exports = function validateCity(req, res, next) {
  const raw = (req.body && req.body.city) || req.query.city || '';
  const city = String(raw).trim().replace(/\s+/g, ' ');

  let error = null;
  if (!city) {
    error = 'Please enter a city name.';
  } else if (city.length < 2 || city.length > 60) {
    error = 'The city name must be between 2 and 60 characters.';
  } else if (!CITY_PATTERN.test(city)) {
    error = 'Use letters only (spaces and hyphens are allowed). Numbers and symbols are not accepted.';
  }

  // Optional "pick" index (which of several cities with the same name)
  let pick = parseInt(req.query.pick, 10);
  if (Number.isNaN(pick) || pick < 0 || pick > 4) pick = 0;

  if (error) {
    // Re-render the form with a helpful message (400 Bad Request)
    return res.status(400).render('index', { title: 'Rain Check', error, city: String(raw).slice(0, 60) });
  }

  req.cleanCity = city;
  req.pick = pick;
  next();
};
