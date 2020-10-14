var path = require('path')
const express = require('express')
const app = express()
var cors = require('cors')
// require('dotenv').config()
// const express = require('express')
// const router = express.Router()
const axios = require('axios');
const stateHash = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'American Samoa': 'AS',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'District Of Columbia': 'DC',
    'Federated States Of Micronesia': 'FM',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Guam': 'GU',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Marshall Islands': 'MH',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Northern Mariana Islands': 'MP',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Palau': 'PW',
    'Pennsylvania': 'PA',
    'Puerto Rico': 'PR',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virgin Islands': 'VI',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY'
  };

  const PLACES_API_KEY=""
  const GEOCODE_API_KEY=""
  const CUSTOM_SEARCH_API_KEY=""
  const SEARCH_ENGINE_ID=""
async function callAPI(url) {
    try {
        const response = await axios.get(url);
        return response
    } catch(err){
        console.error(err);
    }
}


async function getLatLong(street, city, state) {
    try {
        url = "https://maps.googleapis.com/maps/api/geocode/json?address="+encodeURIComponent(street)+","+encodeURIComponent(city)+","+encodeURIComponent(state)+"&key="+GEOCODE_API_KEY
        const json_data = await callAPI(url);
        console.log(json_data)
        if (json_data.data.status == "ZERO_RESULTS") {
            return { "err": "Invalid Address" };
        }
        else {
            return { "err": null, "lat": json_data.data.results[0].geometry.location.lat, "lng": json_data.data.results[0].geometry.location.lng}            
        }
    } catch (err) {
        console.log(err)
    }
}



async function getWeatherReport(lat, lng, time = null) {
    try {
        if (time != null) {
            url = "https://api.darksky.net/forecast/922bbdff39456640dd5dacdf18fb2b04/" + lat + "," + lng + "," + time
            
        }
        else {
            url = "https://api.darksky.net/forecast/922bbdff39456640dd5dacdf18fb2b04/" + lat + "," + lng            
        }
        const json_data = await callAPI(url)
        return json_data.data
    } catch (err) {
        console.log(err)
    }
}

async function getStateSeal(state) {
    try {
        url = "https://www.googleapis.com/customsearch/v1?q=" + state + "%20State%20Seal&cx=" + SEARCH_ENGINE_ID + "&imgSize=huge&imgType=news&num=1&searchType=image&key=" + CUSTOM_SEARCH_API_KEY
        const json_data = await callAPI(url)
        return json_data.data.items[0].link
    } catch (err) {
        console.log(err)
    }
}

async function getCityImages(city) {
    try {
        url = "https://www.googleapis.com/customsearch/v1?q=" + city + "&cx=" + SEARCH_ENGINE_ID + "&num=8&searchType=image&key=" + CUSTOM_SEARCH_API_KEY
        const json_data = await callAPI(url)
        return json_data.data.items
    } catch (err) {
        console.log(err)
    }
}

async function autocomplete(input) {
    try {
        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=" + input + "&types=(cities)&language=en&key=" + PLACES_API_KEY
        const json_data = await callAPI(url)
        return json_data.data
    } catch (err) {
        console.log(err)
    }
}

app.get('/auto_complete', async (req, res) => {
    input = req.query.input
    try {
        const data = await autocomplete(input)
        res.send(data)   
    } catch (err) {
        console.log(err)
    }
})


app.get('/weather_search', async (req, res) => {
    street = req.query.street
    city = req.query.city
    state = req.query.state

    if ((state != undefined) && (state in stateHash)) {
        stateCode = stateHash[state]
    }
    else
    {
        stateCode = state
    }

    try {
        await getLatLong(street, city, stateCode).then(async location => {
            if (location.err == "Invalid Address") {
                res.send(location);
            }
            const lat = location.lat
            const lng = location.lng
            const report = await getWeatherReport(lat,lng)
            return report   
            }).then(async report => {
                // const seal = await getStateSeal(state)
                // report.state_seal = seal
                const city_images = await getCityImages(city)
                report.city_images = city_images
                report.city = city
                report.state = state
                res.send(report)
        })
    } catch (err) {
        console.log(err)
    }
    
})

app.get('/weather_search_with_coordinates', async (req, res) => {
    lat = req.query.lat
    lng = req.query.lng
    state = req.query.state
    city = req.query.city
    try {
            await getWeatherReport(lat,lng).then(async report => {
                const city_images = await getCityImages(city)
                report.city_images = city_images
                report.city = city
                report.state = state
                res.send(report)
        })
    } catch (err) {
        console.log(err)
    }
})

app.get('/weather_detail', async (req, res) => {
    lat = req.query.lat
    lng = req.query.lng
    time = req.query.time
    try {
        const report = await getWeatherReport(lat, lng, time)
        res.send(report)   
    } catch (err) {
        console.log(err)
    }
})

// module.exports = router
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.use(express.json())

app.use(express.static(path.join(__dirname,'dist/frontend')))
app.listen(8081, () => console.log('Server Started'))