// controllers/weatherController.js - the "C" in MVC: handles requests, calls service + model, renders views
const weatherService = require('../services/weatherService');
const { buildForecast } = require('../models/forecastModel');

const POPULAR_CITIES = [
  'London', 'Paris', 'New York', 'Tokyo', 'Berlin', 'Rome',
  'Madrid', 'Dubai', 'Sydney', 'Toronto', 'Astana', 'Almaty',
];

// GET / - home page
function showHome(req, res) {
  res.render('index', { title: 'Rain Check', error: null, city: '' });
}

// GET /popular - quick links
function showPopular(req, res) {
  res.render('popular', { title: 'Popular cities', cities: POPULAR_CITIES });
}

// Shared logic for POST /search and GET /forecast:
// 1) find the city  2) get the forecast  3) process data  4) render result page
async function renderForecast(req, res, next) {
  const city = req.cleanCity;   // set by validateCity middleware
  const pick = req.pick;
  try {
    const matches = await weatherService.searchCities(city);

    // Empty result -> friendly "no results" state (not an error)
    if (matches.length === 0) {
      return res.render('result', { title: 'No results', city, noResults: true });
    }

    const place = matches[pick] || matches[0];
    const daily = await weatherService.getForecast(place.latitude, place.longitude);
    const forecast = buildForecast(daily);

    res.render('result', {
      title: `Forecast for ${place.name}`,
      city,
      noResults: false,
      place,
      matches,
      pick: matches[pick] ? pick : 0,
      ...forecast, // days, tomorrow, summary
    });
  } catch (err) {
    next(err); // sent to the centralized error handler
  }
}

module.exports = {
  showHome,
  showPopular,
  search: renderForecast,        // POST /search
  showForecast: renderForecast,  // GET /forecast
};
