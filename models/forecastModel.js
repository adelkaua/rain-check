// models/forecastModel.js - the "M" in MVC: turns raw API arrays into useful objects
const { describe, RAIN_CODES } = require('../utils/weatherCodes');

const VERDICT_TEXT = {
  rain: 'Yes, it will rain. Take an umbrella! ☔',
  maybe: 'Maybe. There is a chance of rain. 🌂',
  dry: 'No, it should stay dry. 😎',
};

// Formats "2026-11-18" -> "Wed, Nov 18" (UTC avoids off-by-one date shifts)
function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// Decide "rain / maybe / dry" for a single day
function getVerdict({ weatherCode, precipitation, probability }) {
  if (RAIN_CODES.has(weatherCode) || precipitation >= 1 || probability >= 60) return 'rain';
  if (probability >= 30 || precipitation > 0.1) return 'maybe';
  return 'dry';
}

const round1 = (n) => Math.round(n * 10) / 10;

// Main function: raw "daily" object from the API -> { days, tomorrow, summary }
function buildForecast(daily) {
  // The API gives parallel arrays; we combine them into one object per day
  const days = daily.time.map((date, i) => {
    const weatherCode = daily.weather_code[i];
    const precipitation = daily.precipitation_sum[i] ?? 0;
    const probability = daily.precipitation_probability_max[i] ?? 0;
    const verdict = getVerdict({ weatherCode, precipitation, probability });
    const { text, icon } = describe(weatherCode);
    return {
      date,
      label: formatDate(date),
      weatherText: text,
      icon,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      precipitation: round1(precipitation),
      probability,
      wind: Math.round(daily.wind_speed_10m_max[i] ?? 0),
      verdict,
    };
  });

  // days[0] = today, days[1] = tomorrow
  const tomorrow = days[1] || null;

  const rainyDays = days.filter((d) => d.verdict === 'rain').length;
  const totalRain = round1(days.reduce((sum, d) => sum + d.precipitation, 0));
  const wettest = days.reduce((best, d) => (d.precipitation > best.precipitation ? d : best), days[0]);

  return {
    days,
    tomorrow: tomorrow && { ...tomorrow, verdictText: VERDICT_TEXT[tomorrow.verdict] },
    summary: {
      rainyDays,
      totalRain,
      wettest: wettest && wettest.precipitation > 0 ? wettest : null, // null = no rain all week
    },
  };
}

module.exports = { buildForecast };
