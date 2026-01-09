// API Configuration
const API_KEY = '3f992e45cf6c39fb69934a2bb1c4a609';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const locationButtons = document.querySelectorAll('.location-btn');
const currentCity = document.getElementById('currentCity');
const currentDate = document.getElementById('currentDate');
const currentTemp = document.getElementById('currentTemp');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDesc = document.getElementById('weatherDesc');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const pressure = document.getElementById('pressure');
const forecastGrid = document.getElementById('forecastGrid');

// Weather Icons Mapping
const weatherIcons = {
    '01d': 'fas fa-sun',           // clear sky day
    '01n': 'fas fa-moon',          // clear sky night
    '02d': 'fas fa-cloud-sun',     // few clouds day
    '02n': 'fas fa-cloud-moon',    // few clouds night
    '03d': 'fas fa-cloud',         // scattered clouds
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',         // broken clouds
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',    // shower rain
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain',// rain day
    '10n': 'fas fa-cloud-moon-rain',// rain night
    '11d': 'fas fa-bolt',          // thunderstorm
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',     // snow
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',          // mist
    '50n': 'fas fa-smog'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('ClimateWatch app starting...');
    console.log('API Key:', API_KEY.substring(0, 8) + '...');
    
    // Update current date
    updateCurrentDate();
    
    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    locationBtn.addEventListener('click', getWeatherByLocation);
    
    locationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.getAttribute('data-city');
            getWeatherByCity(city);
        });
    });
    
    // Load initial weather data
    getWeatherByCity('Johannesburg');
});

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString('en-ZA', options);
    }
}

// Handle search
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    } else {
        alert('Please enter a city name');
    }
}

// Get weather by user's location
function getWeatherByLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    // Show loading state
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
    locationBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Got location:', position.coords);
            getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            
            // Restore button
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> My Location';
            locationBtn.disabled = false;
        },
        (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your location. Please enable location services or search for a city.');
            
            // Restore button
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> My Location';
            locationBtn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Get weather by city
async function getWeatherByCity(city) {
    try {
        showLoading(true);
        console.log(`Fetching weather for: ${city}`);
        
        // Get current weather
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
        );
        
        console.log('Response status:', currentResponse.status);
        
        if (currentResponse.status === 401) {
            throw new Error('Invalid API Key. Please check your OpenWeatherMap API key.');
        }
        
        if (currentResponse.status === 404) {
            throw new Error(`City "${city}" not found. Try another city name.`);
        }
        
        if (currentResponse.status === 429) {
            throw new Error('API limit exceeded. Please wait a minute and try again.');
        }
        
        if (!currentResponse.ok) {
            throw new Error(`Error ${currentResponse.status}: Unable to fetch weather data`);
        }
        
        const currentData = await currentResponse.json();
        console.log('Weather data received for:', currentData.name);
        
        // Get forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
        );
        
        let forecastData = null;
        if (forecastResponse.ok) {
            forecastData = await forecastResponse.json();
        }
        
        updateCurrentWeather(currentData);
        
        if (forecastData) {
            updateForecast(forecastData);
        } else {
            console.warn('Forecast data not available');
            forecastGrid.innerHTML = '<div class="no-forecast">Forecast data not available</div>';
        }
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        console.error('Weather fetch error:', error);
        
        // Show user-friendly error
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        alert(`Error: ${errorMessage}`);
        
        // If API key is invalid, show demo notice
        if (error.message.includes('Invalid API Key') || error.message.includes('401')) {
            showDemoNotice();
        }
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        showLoading(true);
        console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
        
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            // Try with rounded coordinates
            const latRounded = lat.toFixed(2);
            const lonRounded = lon.toFixed(2);
            console.log(`Retrying with rounded coordinates: ${latRounded}, ${lonRounded}`);
            
            const retryResponse = await fetch(
                `${BASE_URL}/weather?lat=${latRounded}&lon=${lonRounded}&units=metric&appid=${API_KEY}`
            );
            
            if (!retryResponse.ok) {
                throw new Error(`Unable to get weather for your location (${retryResponse.status})`);
            }
            
            const data = await retryResponse.json();
            updateCurrentWeather(data);
            
            // Get forecast for this location
            const forecastResponse = await fetch(
                `${BASE_URL}/forecast?lat=${latRounded}&lon=${lonRounded}&units=metric&appid=${API_KEY}`
            );
            
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                updateForecast(forecastData);
            }
            
            showLoading(false);
            return;
        }
        
        const data = await response.json();
        updateCurrentWeather(data);
        
        // Get forecast for this location
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            updateForecast(forecastData);
        }
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        console.error('Location weather fetch error:', error);
        alert(`Error: ${error.message}. Try searching for a city instead.`);
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    console.log('Updating display for:', data.name);
    
    // Update city name
    currentCity.textContent = `${data.name}, ${data.sys.country}`;
    
    // Update temperature
    const temp = Math.round(data.main.temp);
    currentTemp.textContent = temp;
    
    // Update weather description
    weatherDesc.textContent = data.weather[0].description.charAt(0).toUpperCase() + 
                             data.weather[0].description.slice(1);
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    if (weatherIcons[iconCode]) {
        weatherIcon.innerHTML = `<i class="${weatherIcons[iconCode]}"></i>`;
    } else {
        weatherIcon.innerHTML = '<i class="fas fa-cloud"></i>';
    }
    
    // Update weather details
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Update input with current city
    cityInput.value = data.name;
}

// Update forecast display
function updateForecast(data) {
    if (!forecastGrid) return;
    
    forecastGrid.innerHTML = '';
    
    // Group forecast by day
    const dailyForecasts = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-ZA', { weekday: 'short' });
        const dateKey = date.toDateString();
        
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = {
                day: day,
                date: date,
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyForecasts[dateKey].temps.push(item.main.temp);
        dailyForecasts[dateKey].icons.push(item.weather[0].icon);
        dailyForecasts[dateKey].descriptions.push(item.weather[0].description);
    });
    
    // Display next 5 days
    let dayCount = 0;
    const today = new Date().toDateString();
    
    for (const dateKey in dailyForecasts) {
        if (dateKey === today) continue; // Skip today
        
        const forecast = dailyForecasts[dateKey];
        const maxTemp = Math.round(Math.max(...forecast.temps));
        const minTemp = Math.round(Math.min(...forecast.temps));
        
        // Get most common icon for the day
        const iconCounts = {};
        forecast.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) => 
            iconCounts[a] > iconCounts[b] ? a : b
        );
        
        // Get most common description
        const descCounts = {};
        forecast.descriptions.forEach(desc => {
            descCounts[desc] = (descCounts[desc] || 0) + 1;
        });
        const mostCommonDesc = Object.keys(descCounts).reduce((a, b) => 
            descCounts[a] > descCounts[b] ? a : b
        );
        
        // Create forecast item
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${forecast.day}</div>
            <div class="forecast-icon">
                <i class="${weatherIcons[mostCommonIcon] || 'fas fa-cloud'}"></i>
            </div>
            <div class="forecast-desc">${mostCommonDesc}</div>
            <div class="forecast-temp">
                <span class="temp-high">${maxTemp}°</span>
                <span class="temp-low">${minTemp}°</span>
            </div>
        `;
        
        forecastGrid.appendChild(forecastItem);
        dayCount++;
        
        if (dayCount >= 5) break;
    }
    
    // If no forecast items were added
    if (dayCount === 0) {
        forecastGrid.innerHTML = '<div class="no-forecast">No forecast data available</div>';
    }
}

// Show/hide loading state
function showLoading(isLoading) {
    if (!forecastGrid) return;
    
    if (isLoading) {
        forecastGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading weather data...</p>
            </div>
        `;
    }
}

// Show demo notice
function showDemoNotice() {
    // Remove any existing demo notice
    const existingNotice = document.querySelector('.demo-notice');
    if (existingNotice) existingNotice.remove();
    
    const notice = document.createElement('div');
    notice.className = 'demo-notice';
    notice.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Demo Mode: Using mock data. Check your API key for live weather.</span>
    `;
    
    // Insert after header
    const header = document.querySelector('header');
    if (header && header.parentNode) {
        header.parentNode.insertBefore(notice, header.nextSibling);
    }
}

// Check if we should use demo mode on startup
if (!API_KEY || API_KEY === '' || API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('No API key found. Showing demo notice.');
    setTimeout(showDemoNotice, 100);
}