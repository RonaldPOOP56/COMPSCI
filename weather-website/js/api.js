const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

async function geocodePlace(place) {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(place)}&count=1&language=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    return data.results && data.results.length ? data.results[0] : null;
}

async function getCurrentWeather(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current_weather: 'true',
        temperature_unit: 'celsius',
        windspeed_unit: 'kmh',
        timezone: 'auto'
    });
    const url = `${WEATHER_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather request failed');
    return res.json();
}

function weatherCodeToDesc(code) {
    // Open-Meteo weathercode mapping (condensed)
    const map = {
        0: ['Clear', '☀️'],
        1: ['Mainly clear', '🌤️'],
        2: ['Partly cloudy', '⛅'],
        3: ['Overcast', '☁️'],
        45: ['Fog', '🌫️'],
        48: ['Depositing rime fog', '🌫️'],
        51: ['Light drizzle', '🌦️'],
        53: ['Moderate drizzle', '🌦️'],
        55: ['Dense drizzle', '🌧️'],
        56: ['Light freezing drizzle', '🌧️❄️'],
        57: ['Dense freezing drizzle', '🌧️❄️'],
        61: ['Slight rain', '🌧️'],
        63: ['Moderate rain', '🌧️'],
        65: ['Heavy rain', '⛈️'],
        66: ['Light freezing rain', '🌧️❄️'],
        67: ['Heavy freezing rain', '🌧️❄️'],
        71: ['Slight snow fall', '🌨️'],
        73: ['Moderate snow fall', '🌨️'],
        75: ['Heavy snow fall', '❄️'],
        77: ['Snow grains', '❄️'],
        80: ['Slight rain showers', '🌧️'],
        81: ['Moderate rain showers', '🌧️'],
        82: ['Violent rain showers', '⛈️'],
        85: ['Slight snow showers', '🌨️'],
        86: ['Heavy snow showers', '❄️'],
        95: ['Thunderstorm', '⛈️'],
        96: ['Thunderstorm with slight hail', '⛈️🌨️'],
        99: ['Thunderstorm with heavy hail', '⛈️🌨️']
    };
    return map[code] || ['Unknown', '❓'];
}

// expose to global for app.js
window.geocodePlace = geocodePlace;
window.getCurrentWeather = getCurrentWeather;
window.weatherCodeToDesc = weatherCodeToDesc;