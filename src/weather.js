const CACHE_KEY = "of.weather";
const CACHE_MS = 30 * 60 * 1000;
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const CONDITIONS = [
  [0, "Clear"],
  [2, "Partly cloudy"],
  [3, "Cloudy"],
  [48, "Fog"],
  [57, "Drizzle"],
  [67, "Rain"],
  [77, "Snow"],
  [82, "Showers"],
  [86, "Snow"],
  [99, "Storm"],
];

export function todayLabel(date = new Date()) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${month} ${date.getDate()}`.toUpperCase();
}

function condition(code) {
  return (CONDITIONS.find(([max]) => code <= max) || CONDITIONS.at(-1))[1];
}

function readCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return cached && Date.now() - cached.at < CACHE_MS ? cached.weather : null;
  } catch {
    return null;
  }
}

function writeCache(weather) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), weather }));
  } catch {}
}

function position() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("No geolocation"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: CACHE_MS,
    });
  });
}

async function fetchWeather() {
  const { coords } = await position();
  const params = new URLSearchParams({
    latitude: coords.latitude.toFixed(2),
    longitude: coords.longitude.toFixed(2),
    current: "temperature_2m,weather_code",
  });
  const response = await fetch(`${FORECAST_URL}?${params}`);
  if (!response.ok) throw new Error("Weather unavailable");
  const { current } = await response.json();
  return { temp: Math.round(current.temperature_2m), label: condition(current.weather_code) };
}

export function cachedWeather() {
  return readCache();
}

export async function currentWeather() {
  const cached = readCache();
  if (cached) return cached;
  const weather = await fetchWeather();
  writeCache(weather);
  return weather;
}

export function weatherText(weather) {
  return weather ? `${weather.temp}°C · ${weather.label}` : "";
}
