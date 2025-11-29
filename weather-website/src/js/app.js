// app.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('weather-form');
    const input = document.getElementById('location');
    const btn = document.getElementById('searchBtn');
    const weatherDisplay = document.getElementById('weatherResult');

    // only attach listeners if elements exist
    if (btn) btn.addEventListener('click', doSearch);
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

    // attach form submit only if a form with that id is present
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const location = input ? input.value : '';
            if (location) {
                // use the existing doSearch flow instead of undefined fetchWeatherData
                await doSearch();
            }
        });
    }

    async function doSearch() {
        const place = (input && input.value) ? input.value.trim() : '';
        if (!place) {
            showMessage('Type a location (city, town, or address).');
            return;
        }
        showMessage('Searching…');
        try {
            const loc = await window.geocodePlace(place);
            if (!loc) {
                showMessage('Location not found.');
                return;
            }
            const w = await window.getCurrentWeather(loc.latitude, loc.longitude);
            renderWeather(loc, w);
        } catch (err) {
            showMessage('Error: ' + err.message);
        }
    }

    function showMessage(msg) {
        weatherDisplay.innerHTML = `<div class="msg">${escapeHtml(msg)}</div>`;
    }

    function displayWeather(data) {
        if (data && data.weather) {
            weatherDisplay.innerHTML = `
                <h2>Weather in ${data.name}</h2>
                <p>Temperature: ${data.main.temp}°C</p>
                <p>Condition: ${data.weather[0].description}</p>
            `;
        } else {
            weatherDisplay.innerHTML = '<p>Weather data not available.</p>';
        }
    }

    function renderWeather(loc, data) {
        const cw = data.current_weather;
        const [desc, emoji] = window.weatherCodeToDesc(cw.weathercode);
        const localTime = cw.time || '';
        const html = `
            <div class="card">
                <div class="place">
                    <div class="name">${escapeHtml(loc.name || '')}${loc.admin1 ? ', ' + escapeHtml(loc.admin1) : ''}</div>
                    <div class="country">${escapeHtml(loc.country || '')}</div>
                </div>
                <div class="main">
                    <div class="temp">${Math.round(cw.temperature)}°C</div>
                    <div class="icon">${emoji}</div>
                </div>
                <div class="details">
                    <div>${escapeHtml(desc)}</div>
                    <div>Wind: ${Math.round(cw.windspeed)} km/h</div>
                    <div>Local time: ${escapeHtml(localTime)}</div>
                </div>
            </div>
        `;
        weatherDisplay.innerHTML = html;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
    }
});