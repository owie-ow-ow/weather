var tempText = document.getElementById('tempText')
var wIcon = document.getElementById('wIcon')
var wDesc = document.getElementById('wDesc')
var transparencyToggle = document.getElementById('transparencyToggle')
var searchBox = document.getElementById('searchbar')
var searchModal = document.getElementById('searchmodal')
var searchSubmit = document.getElementById('searchsubmit')
var nameText = document.getElementById('locNameTxt')
var searchResultsModal = document.getElementById('resultsModal')
var locatingMessage = document.getElementById('locatingMessage')

const styleSheet = document.getElementById('styleSheet')

const currentWeatherBase = "https://api.msn.com/weatherfalcon/weather/current?apikey=j5i4gDqHL6nGYwx5wi5kRhXjtf2c5qgFX9fzfk0TOo&activityId=69c11dee-40e6-4888-94da-3a88be97002d&cm=en-us&it=web&user=m-2361EA89BB366C582EEFFDADBA956D7F&scn=ANON&locale=en-us&units=F&appId=9e21380c-ff19-4c78-b4ea-19558e93a5d3&wrapOData=true"
const search = "https://www.bing.com/api/v6/Places/AutoSuggest?appid=EDEC3CB74CF190BBBE26DF7938F3D961E925F593&types=Place&count=10&structuredaddress=true&strucaddrread=1&q="
const hourlyWeatherBase = "https://api.msn.com/weather/hourlyforecast?apiKey=j5i4gDqHL6nGYwx5wi5kRhXjtf2c5qgFX9fzfk0TOo&appid=9e21380c-ff19-4c78-b4ea-19558e93a5d3&cm=en-US&locale=en&units=F&days=12"
var lat = undefined
var lon = undefined

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
            clearAll(); getWeather(split[0], split[1])
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

    var places = await json['value'], len = places !== null ? places.length : 0, i = 0;

    for (i; i < len; i++) {
        lat = places[i]['geo']['latitude']
        lon = places[i]['geo']['longitude']
        locationName = places[i]['address']['text']
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
    raw = await fetch('codeMap.json')
    json = await raw.json()

    if (daytimeStatus == 'night') { daytimeStatus = 'night' } else { daytimeStatus = 'day' }
    return json[daytimeStatus][code]
}

async function getWeather(lat, lon) {
    response = await fetch(currentWeatherBase + `&lat=${lat}&lon=${lon}`)

    rspStatus = await response.status
    json = await response.json()

    if (rspStatus != 200) {
        alert(`Response status does not indicate success (${rspStatus})
            \n${json['responses']['0']['error']['code']} (${json['responses']['0']['error']['desc']})`)
        return
    }

    current = json['value']['0']['responses']['0']['weather']['0']['current']

    temp = `${Math.round(current['temp'])}${json['value']['0']['units']['temperature']}`
    icon = current['urlIcon']
    desc = current['cap']

    if (current['daytime'] == 'd') { daytime = 'day' } else { daytime = 'night' } // check daytime field or whatever
    weather_code = current['icon']

    locName = json['value'][0]['responses'][0]['source']['location']['Name']

    tempText.textContent = temp
    wIcon.src = icon
    wDesc.textContent = desc
    nameText.textContent = locName

    document.body.style.backgroundImage = `url(backgrounds/${await mapCode(weather_code, daytime)}.jpg)`

    var items = document.getElementsByClassName('subCardItem'), len = items !== null ? items.length : 0, i = 0;

    for (i; i < len; i++) {
        items[0].remove()
    }
    getDailyWeather(lat, lon)
    getHourlyWeather(lat, lon)
}

function clearAll() {
    tempText.textContent = ""
    wIcon.src = ""
    wDesc.textContent = ""
    nameText.textContent = ""
}

async function getHourlyWeather(lat, lon) {
    response = await fetch(hourlyWeatherBase + `&lat=${lat}&lon=${lon}`)
    json = await response.json()

    current = json['value'][0]['responses'][0]['weather'][0]['days'][0]['hourly'].forEach(element => {
        card = document.getElementById('hourlyCard')

        container = document.createElement('div')

        var stamp = element['valid'];

        var now = new Date().toLocaleString(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: true });

        document.getElementById('asOfText').textContent = "Hourly weather as of " + now;

        img = element['urlIcon']
        cap = element['cap']

        var capElement = document.createElement('p')
        capElement.textContent = cap

        var tempText = document.createElement('p')
        tempText.classList.add('cardTemp')
        tempText.textContent = `${element['temp']}${json['value'][0]['units']['temperature']}`
        container.appendChild(tempText)

        var hourElement = document.createElement('h6')
        hourElement.classList.add('cardText')
        hourElement.textContent = fmtDate(new Date(stamp))

        var imgElement = document.createElement('img')
        imgElement.src = img

        container.appendChild(imgElement)
        container.appendChild(capElement)
        tempText.appendChild(hourElement)

        container.classList.add('subCardItem')
        container.classList.add('border')

        card.appendChild(container)
    });
}

async function getDailyWeather(lat, lon) {
    response = await fetch(hourlyWeatherBase + `&lat=${lat}&lon=${lon}`)
    json = await response.json()

    var card = document.getElementById('dailyCard')
    current = json['value'][0]['responses'][0]['weather'][0]['days'].forEach(element => {
        let curHour = element['hourly'][0]
        console.log(curHour)

        container = document.createElement('div')

        var stamp = curHour['valid'];

        var now = new Date().getTime() + 24 * 60 * 60 * 1000

        document.getElementById('asOfTextDaily').textContent = "Daily weather as of " + new Date().toLocaleString(navigator.language, { "weekday": "long" });
        
        img = curHour['urlIcon']
        cap = curHour['cap']
        summary = curHour['summary']
        
        var capElement = document.createElement('p')
        capElement.textContent = cap
        var tempText = document.createElement('p')
        tempText.classList.add('cardTemp')
        tempText.textContent = `${curHour['temp']}${json['value'][0]['units']['temperature']}`
        container.appendChild(tempText)

        var dayElement = document.createElement('h6')
        dayElement.classList.add('cardText')
        if (new Date().getDate() == new Date(stamp).getDate()) {
            dayElement.textContent = 'Today'
        }
        else {
            dayElement.textContent = new Date(stamp).toLocaleString(navigator.language, { "weekday": "long" })
        }

        var dateElement = document.createElement('h6')
        dateElement.classList.add('cardText')
        dateElement.textContent = new Date(stamp).toLocaleString(navigator.language, { "dateStyle": "long" })

        var imgElement = document.createElement('img')
        imgElement.src = img

        container.appendChild(imgElement)
        container.appendChild(capElement)
        tempText.appendChild(dayElement)
        tempText.appendChild(dateElement)

        container.classList.add('subCardItem')
        container.classList.add('border')

        console.log(container)

        card.appendChild(container)
    });
}

function fmtDate(date) {
    return date.toLocaleString(navigator.language, { hour: 'numeric', hour12: true })
}

navigator.geolocation.getCurrentPosition(async (position) => {
    clearAll()
    await getWeather(position.coords.latitude, position.coords.longitude)
    locatingMessage.close()
});
