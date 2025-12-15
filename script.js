// API Configuration
const API_KEY = ''; // REPLACE THIS WITH YOUR KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
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
    '09d': 'fas fa-cloud-rain',    // shower rainssss
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

// Initialize with default city
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    getWeatherByCity('Johannesburg');
    
    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    locationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.getAttribute('data-city');
            getWeatherByCity(city);
        });
    });
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
    currentDate.textContent = now.toLocaleDateString('en-ZA', options);
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

// Get weather by city
async function getWeatherByCity(city) {
    try {
        showLoading(true);
        
        // Get current weather
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentData = await currentResponse.json();
        
        // Get forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        const forecastData = await forecastResponse.json();
        
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        alert(`Error: ${error.message}. Please try another city.`);
        console.error('Weather fetch error:', error);
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    currentCity.textContent = `${data.name}, ${data.sys.country}`;
    currentTemp.textContent = Math.round(data.main.temp);
    weatherDesc.textContent = data.weather[0].description;
    
    const iconCode = data.weather[0].icon;
    weatherIcon.innerHTML = `<i class="${weatherIcons[iconCode] || 'fas fa-cloud'}"></i>`;
    
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Update input with current city
    cityInput.value = data.name;
}

// Update forecast display
function updateForecast(data) {
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
        
        // Create forecast item
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${forecast.day}</div>
            <div class="forecast-icon">
                <i class="${weatherIcons[mostCommonIcon] || 'fas fa-cloud'}"></i>
            </div>
            <div class="forecast-desc">${forecast.descriptions[0]}</div>
            <div class="forecast-temp">
                <span class="temp-high">${maxTemp}°</span>
                <span class="temp-low">${minTemp}°</span>
            </div>
        `;
        
        forecastGrid.appendChild(forecastItem);
        dayCount++;
        
        if (dayCount >= 5) break;
    }
}

// Show/hide loading state
function showLoading(isLoading) {
    if (isLoading) {
        forecastGrid.innerHTML = '<div class="loading">Loading weather data...</div>';
    }
}

// Demo mode with mock data (for testing without API key)
// Enhanced demo mode with mock data for all cities
function enableDemoMode() {
    console.log('Demo mode enabled - using enhanced mock data');
    
    // Mock data for different cities
    const mockCityData = {
        'Johannesburg': {
            name: 'Johannesburg',
            sys: { country: 'ZA' },
            main: { temp: 24, feels_like: 25, humidity: 45, pressure: 1013 },
            weather: [{ description: 'Sunny', icon: '01d' }],
            wind: { speed: 3.3 }
        },
        'Cape Town': {
            name: 'Cape Town',
            sys: { country: 'ZA' },
            main: { temp: 18, feels_like: 17, humidity: 65, pressure: 1015 },
            weather: [{ description: 'Partly Cloudy', icon: '02d' }],
            wind: { speed: 5.2 }
        },
        'Durban': {
            name: 'Durban',
            sys: { country: 'ZA' },
            main: { temp: 26, feels_like: 28, humidity: 70, pressure: 1012 },
            weather: [{ description: 'Humid', icon: '50d' }],
            wind: { speed: 2.1 }
        },
        'Pretoria': {
            name: 'Pretoria',
            sys: { country: 'ZA' },
            main: { temp: 25, feels_like: 26, humidity: 50, pressure: 1014 },
            weather: [{ description: 'Clear', icon: '01d' }],
            wind: { speed: 3.8 }
        }
    };
    
    // Mock forecast data (same for all cities in demo)
    const mockForecastData = {
        list: [
            { dt: Date.now()/1000 + 86400, main: { temp: 25 }, weather: [{ description: 'Sunny', icon: '01d' }] },
            { dt: Date.now()/1000 + 172800, main: { temp: 23 }, weather: [{ description: 'Partly Cloudy', icon: '02d' }] },
            { dt: Date.now()/1000 + 259200, main: { temp: 22 }, weather: [{ description: 'Cloudy', icon: '03d' }] },
            { dt: Date.now()/1000 + 345600, main: { temp: 21 }, weather: [{ description: 'Light Rain', icon: '10d' }] },
            { dt: Date.now()/1000 + 432000, main: { temp: 24 }, weather: [{ description: 'Clear', icon: '01d' }] }
        ]
    };
    
    // Override the getWeatherByCity function for demo mode
    window.getWeatherByCity = function(city) {
        console.log('Demo: Loading weather for', city);
        
        // Use specific city data or default to Johannesburg
        const cityData = mockCityData[city] || mockCityData['Johannesburg'];
        
        // Simulate API delay
        setTimeout(() => {
            updateCurrentWeather(cityData);
            updateForecast(mockForecastData);
        }, 300);
    };
    
    // Initialize with default city
    updateCurrentWeather(mockCityData['Johannesburg']);
    updateForecast(mockForecastData);
}

// If no API key, enable demo mode
if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('No API key found. Enabling demo mode.');
    enableDemoMode();
}