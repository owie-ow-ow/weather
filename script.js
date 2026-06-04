var tempText = document.getElementById('tempText')
var wDesc = document.getElementById('wDesc')
var wIcon = document.getElementById('wIcon')
var transparencyToggle = document.getElementById('transparencyToggle')
var searchBox = document.getElementById('searchbar')
var searchModal = document.getElementById('searchmodal')
var searchSubmit = document.getElementById('searchsubmit')
var nameText = document.getElementById('locNameTxt')
var searchResultsModal = document.getElementById('resultsModal')
var locatingMessage = document.getElementById('locatingMessage')

const styleSheet = document.getElementById('styleSheet')

const currentWeatherBase = "https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,is_day&forecast_days=1&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch"
const search = "https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&name="
const hourlyWeatherBase = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,weather_code,is_day&forecast_days=1&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch"
const dailyWeatherBase = "https://api.open-meteo.com/v1/forecast?daily=weather_code,temperature_2m_mean&forecast_days=7&wind_speed_unit=mph&temperature_unit=fahrenheit"
var lat = undefined
var lon = undefined

var descMap = undefined
var bgMap = undefined

locatingMessage.showModal()

locatingMessage.addEventListener("click", (e) => {
    if (e.target === locatingMessage) {
        locatingMessage.close()
    }
});

searchResultsModal.addEventListener("click", (e) => {
    if (e.target === searchResultsModal) {
        searchResultsModal.close()
    }
});

transparencyToggle.addEventListener("change", (e) => {
    var divs = document.getElementsByClassName('transparent'), len = divs !== null ? divs.length : 0, i = 0;

    for (i; i < len; i++) {
        if (!transparencyToggle.checked) {
            divs[i].classList.add('noTransparency')
        }
        else {
            divs[i].classList.remove('noTransparency')
        }
    }
})

document.addEventListener("DOMContentLoaded", () => {
    transparencyToggle.checked = true
})

searchSubmit.addEventListener('click', async () => {
    await getSearchResults(searchBox.value)
})

function populateLocations(results) {
    container = document.createElement('div')
    container.classList.add('searchResults')
    results.forEach(element => {
        let split = element.split(',')

        var button = document.createElement('button')
        button.classList.add('transparent')

        button.onclick = () => {
            clearAll(); getWeather(split[0], split[1], formatName(split[2], split[3]).split('(')[0])
        }
        button.textContent = formatName(split[2], split[3])

        container.appendChild(button)
        searchResultsModal.appendChild(container)
    });
}

function formatName(p1, p2) {
    if (p2 == undefined) {
        p2 = null
        return `${p1}`
    }
    else {
        return `${p1}, ${p2}`
    }
}

searchResultsModal.addEventListener('close', () => {
    locations = [];
    var els = document.getElementsByClassName('searchResults')[0].remove()
    if (els) els.remove()
})

var locations = [];

async function getSearchResults(q) {
    if ((q && q.keyCode == 13) || q == 0) {
        q = searchBox.value;
    }
    r = await fetch(search + searchBox.value)
    json = await r.json()

    var places = await json['results'], len = places !== null ? places.length : 0, i = 0;

    for (i; i < len; i++) {
        lat = places[i]['latitude']
        lon = places[i]['longitude']
        locationName = `${places[i]['name']}, ${places[i]['admin1']} (${places[i]['country']})`
        formatted = `${lat},${lon},${locationName}`

        locations.push(formatted)
    }


    if (locations.length == 0) {
        alert("No locations found :(")
    }
    else {
        searchResultsModal.showModal()
    }
    populateLocations(locations)
}

async function mapCode(code, daytimeStatus) {
    return bgMap[daytimeStatus][code]
}

async function mapIcon(code, daytimeStatus) {
    console.log(descMap[code][daytimeStatus])
    return descMap[code][daytimeStatus]['image']
}

async function mapDesc(code, daytimeStatus) {
    return descMap[code][daytimeStatus]['description']
}

async function getWeather(lat, lon, nameOverride = null) {
    if (!descMap) {
        descMap = await (await fetch('descMap.json')).json()
    }
    if (!bgMap) {
        bgMap = await (await fetch('codeMap.json')).json()
    }

    try {
        var response = await fetch(currentWeatherBase + `&latitude=${lat}&longitude=${lon}`, { signal: AbortSignal.timeout(10000) });
    } catch (error) {
        console.log(error)
        if (error.name === 'TimeoutError') {
            alert('The request took too long.\nThe service may be temporarily unavailable.');
        }
    }

    if (response.status == 429) {
        alert('There has been too many requests from your network at this time.\nTry again later.')
    }
    else if (!response.ok) {
        alert('A network error occurred! ', httpStatus, response.statusText);
    }


    json = await response.json()

    current = json['current']
    weather_code = current['weather_code']

    if (current['is_day'] == '1') { daytime = 'day' } else { daytime = 'night' } // check daytime field or whatever

    temp = `${Math.round(current['temperature_2m'])}${json['current_units']['temperature_2m']}`
    desc = await mapDesc(weather_code, daytime)
    icon = await mapIcon(weather_code, daytime)
    console.log(icon)

    if (!nameOverride) {
        locName = "Current Location"
    }
    else {
        locName = nameOverride
    }

    tempText.textContent = temp
    wDesc.textContent = desc
    wIcon.src = icon
    nameText.textContent = locName

    document.body.style.backgroundImage = `url(backgrounds/${await mapCode(weather_code, daytime)}.jpg)`
    document.body.style.backgroundSize = "cover"

    var items = document.getElementsByClassName('subCardItem'), len = items !== null ? items.length : 0, i = 0;

    for (i; i < len; i++) {
        items[0].remove()
    }
    getDailyWeather(lat, lon)
    getHourlyWeather(lat, lon)
}

function clearAll() {
    tempText.textContent = ""
    wDesc.textContent = ""
    nameText.textContent = ""
}

async function getHourlyWeather(lat, lon) {
    response = await fetch(hourlyWeatherBase + `&latitude=${lat}&longitude=${lon}`)
    json = await response.json()

    const tempUnit = json['hourly_units']['temperature_2m']

    let temps = Object.values(json['hourly']['temperature_2m']);
    let times = Object.values(json['hourly']['time']);
    let codes = Object.values(json['hourly']['weather_code']);
    let isDays = Object.values(json['hourly']['is_day']);

    for (let i = 0; i < temps.length; i++) {
        const temp = temps[i];
        const time = times[i];
        const code = codes[i];
        const isDay = codes[i];
        if (isDay == '1') { daytime = 'day' } else { daytime = 'night' } // check daytime field or whatever again
        console.log(daytime)

        card = document.getElementById('hourlyCard')
        container = document.createElement('div')

        var capElement = document.createElement('h3')
        capElement.textContent = await mapDesc(code, daytime)

        var tempText = document.createElement('p')
        tempText.classList.add('cardTemp')
        tempText.textContent = `${Math.round(temp)}${tempUnit}`
        container.appendChild(tempText)

        var hourElement = document.createElement('h6')
        hourElement.classList.add('cardText')
        hourElement.textContent = fmtTime(new Date(time))

        var now = new Date().toLocaleString(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: true });
        document.getElementById('asOfText').textContent = "Hourly weather as of " + now;

        var img = document.createElement('img')
        img.src = await mapIcon(code, daytime)
        img.id = "wIcon"

        container.appendChild(img)

        container.appendChild(capElement)
        tempText.appendChild(hourElement)

        container.classList.add('subCardItem')
        container.classList.add('border')

        card.appendChild(container)
    }
}

async function getDailyWeather(lat, lon) {
    response = await fetch(dailyWeatherBase + `&latitude=${lat}&longitude=${lon}`)
    json = await response.json()

    console.log(json)

    const tempUnit = json['daily_units']['temperature_2m_mean']

    let temps = Object.values(json['daily']['temperature_2m_mean']);
    let times = Object.values(json['daily']['time']);
    let codes = Object.values(json['daily']['weather_code']);

    for (let i = 0; i < temps.length; i++) {
        const temp = temps[i];
        const time = times[i];
        const code = codes[i];
        card = document.getElementById('dailyCard')
        container = document.createElement('div')

        var capElement = document.createElement('h3')
        capElement.textContent = await mapDesc(code, daytime)

        var tempText = document.createElement('p')
        tempText.classList.add('cardTemp')
        tempText.textContent = `${Math.round(temp)}${tempUnit}`
        container.appendChild(tempText)

        var dayElement = document.createElement('h6')
        dayElement.classList.add('cardText')
        console.log(time)
        dayElement.textContent = time

        var now = new Date().toLocaleString(navigator.language, { weekday: "long" });
        document.getElementById('asOfTextDaily').textContent = "Daily weather as of " + now;

        var img = document.createElement('img')
        img.src = await mapIcon(code, daytime)
        img.id = "wIcon"

        container.appendChild(img)

        container.appendChild(capElement)
        tempText.appendChild(dayElement)

        container.classList.add('subCardItem')
        container.classList.add('border')

        card.appendChild(container)
    }
}

function fmtTime(date) {
    return date.toLocaleString(navigator.language, { hour: 'numeric', hour12: true })
}


navigator.geolocation.getCurrentPosition(async (position) => {
    clearAll()
    await getWeather(position.coords.latitude, position.coords.longitude)
    locatingMessage.close()
});
