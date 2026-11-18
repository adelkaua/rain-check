// services/weatherService.js - ALL communication with the Open-Meteo API (via Axios) lives here.
const axios = require('axios');

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// One Axios instance with a timeout, so a slow API can never hang the server
const http = axios.create({
  timeout: Number(process.env.API_TIMEOUT_MS) || 8000,
  headers: { Accept: 'application/json' },
});

// Error with a user-friendly message and the HTTP status to answer with
class ApiError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Converts any Axios failure into an ApiError (and logs technical details)
function toApiError(err, what) {
  console.error(`[API ERROR] ${what}:`, err.code || '', err.response ? err.response.status : '', err.message);

  if (err instanceof ApiError) return err;
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return new ApiError('The weather service took too long to respond. Please try again.', 504);
  }
  if (err.response) {
    const s = err.response.status;
    if (s === 429) return new ApiError('Too many requests to the weather service. Please wait a minute and try again.', 429);
    if (s === 401 || s === 403) return new ApiError('The weather service rejected the request (access denied).', 502);
    if (s >= 500) return new ApiError('The weather service is having problems right now. Please try again later.', 502);
    return new ApiError('The weather service could not process this request.', 502);
  }
  if (err.request) {
    return new ApiError('Cannot reach the weather service. Check your internet connection.', 503);
  }
  return new ApiError('Unexpected error while contacting the weather service.', 500);
}

// API request #1: city name -> list of matching places (with coordinates)
async function searchCities(name) {
  try {
    const { data } = await http.get(GEOCODING_URL, {
      params: { name, count: 5, language: 'en', format: 'json' },
    });
    // When nothing is found the API omits "results" -> return empty array ("no results" state)
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    throw toApiError(err, 'geocoding');
  }
}

// API request #2: coordinates -> 7-day daily forecast
async function getForecast(latitude, longitude) {
  try {
    const { data } = await http.get(FORECAST_URL, {
      params: {
        latitude,
        longitude,
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'precipitation_probability_max',
          'wind_speed_10m_max',
        ].join(','),
        timezone: 'auto', // dates match the city's local time
        forecast_days: 7,
      },
    });
    if (!data || !data.daily || !Array.isArray(data.daily.time)) {
      throw new ApiError('The weather service returned unexpected data.', 502);
    }
    return data.daily;
  } catch (err) {
    throw toApiError(err, 'forecast');
  }
}

module.exports = { searchCities, getForecast, ApiError };
