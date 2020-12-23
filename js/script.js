const API_KEY = '94157f8fc0fe1b469ba572c42422ffcf';

async function getByCityName(cityName) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`);
    return await response.json()
}

showError = (errorMessage) => {
    let errorDiv = document.querySelector('.error');
    errorDiv.innerHTML = errorMessage;
    setTimeout(() => {
        errorDiv.innerHTML = '';
    }, 3000);
};

async function getByCityCoordinates(coordinates) {
    [lat, lon] = [coordinates.coords.latitude, coordinates.coords.longitude];
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    return await response.json()
}

replaceSymbols = (cityName) => {
    return cityName.replace(/\s/g, "_");
};



weatherCityWaiting = (cityName) => {

};

setWeatherHere = (weather) => {
    const weatherHereTemplate = document.querySelector('#main_city_now');
    const newWeatherHere = document.importNode(weatherHereTemplate.content, true);
    setWeatherParameters(newWeatherHere, weather);
    return newWeatherHere;
};

setWeatherCity = (weather) => {
    const weatherCityTemplate = document.querySelector('#city');
    const newWeatherCity = document.importNode(weatherCityTemplate.content, true);
    setWeatherParameters(newWeatherCity, weather);
    newWeatherCity.querySelector('.delete-button').addEventListener('click', removeFromFavorites);
    newWeatherCity.firstElementChild.setAttribute('cityName', replaceSymbols(weather.name));
    return newWeatherCity;
};

async function updateWeatherHere() {
    weatherHere.innerHTML = "";
    placeForWaitingLabel.innerHTML = "";
    const waitingLabelTemplate = document.querySelector("#waiting_label");
    placeForWaitingLabel.append(document.importNode(waitingLabelTemplate.content, true));
    const weatherHereWaitingTemplate = document.querySelector('#main_city_waiting');
    weatherHere.append(document.importNode(weatherHereWaitingTemplate.content, true));

    navigator.geolocation.getCurrentPosition(coordinates => {
        getByCityCoordinates(coordinates)
            .then(weather => {
                weatherHere.innerHTML = "";
                placeForWaitingLabel.innerHTML = "";
                weatherHere.append(setWeatherHere(weather));
            }).catch(() => showError('Something went wrong. Try again.'))
    }, () => getByCityName("Saint%20Petersburg").then(weather => {
        weatherHere.innerHTML = "";
        placeForWaitingLabel.innerHTML = "";
        weatherHere.append(setWeatherHere(weather));
    }).catch(() => showError('Something went wrong. Try again.')))
}

setWeatherParameters = (element, weatherObject) => {
    element.querySelector('.city_name').innerHTML = weatherObject.name;
    element.querySelector('.icon-weather').src = `https://openweathermap.org/img/wn/${weatherObject.weather[0].icon}.png`;
    element.querySelector('.degrees').innerHTML = `${Math.round(weatherObject.main.temp)}°C`;
    element.querySelector('.wind_line .info').innerHTML = `${weatherObject.wind.speed} m/s`;
    element.querySelector('.cloudiness_line .info').innerHTML = `${weatherObject.clouds.all}%`;
    element.querySelector('.pressure_line .info').innerHTML = `${weatherObject.main.pressure} hpa`;
    element.querySelector('.humidity_line .info').innerHTML = `${weatherObject.main.humidity}%`;
    element.querySelector('.coordinates_line .info').innerHTML = `[${weatherObject.coord.lat.toFixed(2)}, ${weatherObject.coord.lon.toFixed(2)}]`;
    return element;
};

getFavoriteList = () => {
    return JSON.parse(localStorage.getItem('favoritesList'))
};

removeFromFavorites = evt => {
    const thisCityName = evt.currentTarget.parentElement.firstElementChild.innerHTML;
    const favoritesList = getFavoriteList();
    localStorage.setItem('favoritesList', JSON.stringify(favoritesList.filter(cityName => cityName !== thisCityName)));
    updateWeatherFavorites();
};

addToFavorites = async evt => {
    evt.preventDefault();
    const searchInput = document.getElementById('add_new_city');
    const cityName = searchInput.value.trim();
    searchInput.value = '';
    let exist = false;
    const list = getFavoriteList();
    list.some(x => x.toLowerCase() === cityName.toLowerCase());
    if (!exist) {
        let response;
        try {
            response = await getByCityName(cityName);
        } catch (e) {
            showError('Something went wrong. Try again.')
        }
        console.log(response);
        if (response.cod === 200) {
            const favoritesList = getFavoriteList();
            let coordinates = {coords: {latitude: response.coord.lat, longitude: response.coord.lon}};
            const responseWithName = await getByCityCoordinates(coordinates);
            if (!(favoritesList.includes(responseWithName.name))) {
                localStorage.setItem('favoritesList', JSON.stringify([responseWithName.name, ...favoritesList]));
                updateWeatherFavorites();
            } else {
                showError('This city is already in list');
            }
        } else {
            showError('City not found')
        }
    } else {
        showError('This city is already in list');
    }
};

updateWeatherFavorites = () => {
    const favoritesList = getFavoriteList();
    let citiesElementToRemove = [];

    let citiesToAdd = favoritesList.filter(x =>
        !weatherCity.querySelector(`.weather_city[cityName=${replaceSymbols(x.toString())}]`)
    );


    for (const cityElement of weatherCity.children) {
        const thisCityName = cityElement.querySelector('.city_name').innerText;
        if (!(favoritesList.includes(thisCityName))) {
            citiesElementToRemove.push(cityElement);
        }
    }
    citiesElementToRemove.forEach(cityElementToRemove => weatherCity.removeChild(cityElementToRemove));
    citiesToAdd.forEach(cityToAdd => {
        const weatherCityWaitingTemplate = document.querySelector('#city_waiting');
        const newWeatherCityWaiting = document.importNode(weatherCityWaitingTemplate.content, true);
        newWeatherCityWaiting.querySelector('.city_name').innerText = cityToAdd;
        newWeatherCityWaiting.firstElementChild.setAttribute('cityName', replaceSymbols(cityToAdd));
        weatherCity.append(newWeatherCityWaiting);
        const newCityElement = weatherCity.querySelector(`.weather_city[cityName=${replaceSymbols(cityToAdd)}]`);
        getByCityName(cityToAdd)
            .then(weather =>
                weatherCity.replaceChild(setWeatherCity(weather), newCityElement))
            .catch(() => showError('Something went wrong. Try again.'));
    })
}
;

const weatherHere = document.querySelector('.main_city');
const weatherCity = document.querySelector('.cities');
const placeForWaitingLabel = document.querySelector('#place_for_waiting_label');

if (!localStorage.getItem('favoritesList')) {
    localStorage.setItem('favoritesList', '[]');
}

window.onoffline = (e) => showError('Internet connection lost. Try again.');

updateWeatherHere();
updateWeatherFavorites();

updateButton = document.querySelectorAll('.update_button_text');
for (let i = 0; i < updateButton.length; i++) {
    if (updateButton) {
        updateButton[i].addEventListener('click', updateWeatherHere)
    }
}

addCityButton = document.querySelectorAll('.add_new_city');
for (let i = 0; i < addCityButton.length; i++) {
    if (addCityButton) {
        addCityButton[i].addEventListener('submit', addToFavorites);
    }
}
