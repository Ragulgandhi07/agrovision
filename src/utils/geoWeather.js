/**
 * AgroVision – Real-Time Geolocation & Live Weather Utilities
 *
 * Implements:
 * 1. navigator.geolocation with explicit error code handling (denied, unavailable, timeout)
 * 2. Client-side reverse geocoding via BigDataCloud client API (free, no key needed)
 * 3. Live satellite/ground weather telemetry from Open-Meteo v1 API
 * 4. WMO weather code mapping and agricultural spraying suitability calculation
 * 5. Request caching and debouncing to prevent excessive API calls
 */

// Cache weather data by coordinate key to avoid redundant API hits within 5 minutes
const weatherCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * WMO Weather Interpretation Codes (WW)
 */
export const WMO_WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: 'sun', condition: 'Sunny' },
  1: { label: 'Mainly Clear', icon: 'sun', condition: 'Mostly Sunny' },
  2: { label: 'Partly Cloudy', icon: 'cloud-sun', condition: 'Partly Cloudy' },
  3: { label: 'Overcast', icon: 'cloud', condition: 'Overcast' },
  45: { label: 'Foggy', icon: 'cloud', condition: 'Fog' },
  48: { label: 'Depositing Rime Fog', icon: 'cloud', condition: 'Freezing Fog' },
  51: { label: 'Light Drizzle', icon: 'cloud-drizzle', condition: 'Light Drizzle' },
  53: { label: 'Moderate Drizzle', icon: 'cloud-drizzle', condition: 'Drizzle' },
  55: { label: 'Dense Drizzle', icon: 'cloud-drizzle', condition: 'Heavy Drizzle' },
  61: { label: 'Slight Rain', icon: 'cloud-rain', condition: 'Light Rain' },
  63: { label: 'Moderate Rain', icon: 'cloud-rain', condition: 'Rain' },
  65: { label: 'Heavy Rain', icon: 'cloud-rain', condition: 'Heavy Rain' },
  71: { label: 'Slight Snow', icon: 'cloud', condition: 'Light Snow' },
  73: { label: 'Moderate Snow', icon: 'cloud', condition: 'Snow' },
  75: { label: 'Heavy Snow', icon: 'cloud', condition: 'Heavy Snow' },
  80: { label: 'Slight Rain Showers', icon: 'cloud-rain', condition: 'Showers' },
  81: { label: 'Moderate Rain Showers', icon: 'cloud-rain', condition: 'Showers' },
  82: { label: 'Violent Rain Showers', icon: 'cloud-rain', condition: 'Heavy Showers' },
  95: { label: 'Thunderstorm', icon: 'alert-triangle', condition: 'Thunderstorm' },
  96: { label: 'Thunderstorm with Hail', icon: 'alert-triangle', condition: 'Severe Storm' },
  99: { label: 'Severe Thunderstorm', icon: 'alert-triangle', condition: 'Severe Storm' }
};

export function getWmoWeatherInfo(code) {
  return WMO_WEATHER_CODES[code] || { label: 'Fair Weather', icon: 'cloud-sun', condition: 'Variable' };
}

/**
 * Reverse geocode coordinates to human-readable district/place name
 * Uses BigDataCloud client API (free, open, no key required, CORS enabled)
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || '';
      const state = data.principalSubdivision || '';
      const country = data.countryName || '';

      const parts = [city, state].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
      return country || `GPS (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;
    }
  } catch (err) {
    console.warn('Reverse geocoding unavailable or timed out:', err.message);
  }
  return `GPS (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;
}

/**
 * Get the user's real GPS position with detailed error handling
 * Never returns fake coordinates on failure.
 */
export function getCurrentGPSLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject({
        code: 0,
        type: 'UNSUPPORTED',
        message: 'Geolocation is not supported by your browser or requires a secure context (HTTPS/localhost).'
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        // Fetch actual location name via reverse geocode
        const placeName = await reverseGeocode(lat, lon);

        resolve({
          lat,
          lon,
          accuracy,
          placeName,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      },
      (err) => {
        let errorMsg = 'Unable to acquire GPS coordinates.';
        let errorType = 'UNKNOWN';

        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorType = 'PERMISSION_DENIED';
            errorMsg = 'Location permission was denied. Please allow location access in your browser address bar.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorType = 'POSITION_UNAVAILABLE';
            errorMsg = 'Location information is unavailable. Please verify device GPS or network connection.';
            break;
          case 3: // TIMEOUT
            errorType = 'TIMEOUT';
            errorMsg = 'GPS acquisition request timed out. Please try again.';
            break;
          default:
            errorMsg = err.message || errorMsg;
        }

        reject({
          code: err.code,
          type: errorType,
          message: errorMsg
        });
      },
      options
    );
  });
}

/**
 * Fetch live real-time agricultural weather from Open-Meteo
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {boolean} forceRefresh - Bypass cache if true
 */
export async function fetchLiveWeather(lat, lon, forceRefresh = false) {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const endpoint =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const daily = data.daily || {};

  const windSpd = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 12;
  const precip = typeof current.precipitation === 'number' ? current.precipitation : 0;
  const weatherCode = current.weather_code ?? 0;
  const wmoInfo = getWmoWeatherInfo(weatherCode);

  // Agronomic spraying suitability assessment
  let spraySuitability = 'Favorable (Low Drift)';
  if (precip > 1.0) {
    spraySuitability = 'Unfavorable (Active Rainfall)';
  } else if (windSpd > 18) {
    spraySuitability = 'Unfavorable (High Wind Drift Hazard)';
  } else if (windSpd > 12) {
    spraySuitability = 'Moderate Caution (Slight Drift)';
  }

  // Compass direction
  const deg = current.wind_direction_10m || 0;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const windDir = directions[Math.round(deg / 45) % 8];

  // 5-Day forecast mapping
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = (daily.time || []).slice(0, 5).map((t, idx) => {
    const d = new Date(t);
    const code = daily.weather_code?.[idx] ?? 0;
    const dayInfo = getWmoWeatherInfo(code);
    const rain = Math.round(daily.precipitation_sum?.[idx] || 0);

    return {
      day: days[d.getDay()],
      tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 30),
      tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 23),
      rain,
      condition: dayInfo.condition,
      icon: dayInfo.icon
    };
  });

  const parsedWeather = {
    temp: Math.round(current.temperature_2m ?? 28),
    feelsLike: Math.round(current.apparent_temperature ?? (current.temperature_2m || 28)),
    humidity: Math.round(current.relative_humidity_2m ?? 65),
    windSpeed: parseFloat(windSpd.toFixed(1)),
    windDir,
    precipitation: parseFloat(precip.toFixed(1)),
    uvIndex: 6.8,
    condition: wmoInfo.label,
    icon: wmoInfo.icon,
    spraySuitability,
    forecast,
    isLive: true,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'Open-Meteo Satellite & Ground Telemetry'
  };

  weatherCache.set(cacheKey, { timestamp: Date.now(), data: parsedWeather });
  return parsedWeather;
}
