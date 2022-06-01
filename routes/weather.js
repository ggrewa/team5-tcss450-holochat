const express = require('express')
const router = express.Router()
const req = require('request')

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const jwt = require('jsonwebtoken')
require("dotenv").config();
const config = {
    secret: process.env.JSON_WEB_TOKEN
}

router.get("/:location?", (request, response, next) => {
    if(!isStringProvided(request.params.location)){
        response.status(400).send({
            message: "Missing required information"
        })
    } else{
        next();
    }

}, (request, response) => {
    //check zip code
    if(request.params.location.length == 5){
        let zip = request.params.location
        const url = `https://www.zipcodeapi.com/rest/`+ process.env.ZIP_ID +`/info.json/`+ zip +`/degrees`
        req({ url: url, json: true }, function (err, resp) { 
            if(err){
                response.status(400).send({
                    message: "Error fetching url"
                })
            } else{
                let lat = resp.body.lat;
                let lon = resp.body.lng;
                let city = resp.body.city;

                console.log(resp.body)

                const url2 = `https://api.openweathermap.org/data/2.5/onecall?lat=`+ lat +`&lon=`+ lon +`&appid=` + process.env.WEATHER_ID
  
                req({ url: url2, json: true }, function (error, res) { 
                    if(error){
                        response.status(400).send({
                            message: "Error fetching url"
                        })
                    } else{
                        response.json({
                            success: true,
                            city: city,
                            tempC: (res.body.current.temp - 273.15),
                            tempF: 1.8*(res.body.current.temp - 273.15) + 32,
                            feel: res.body.current.feels_like,
                            pressure: res.body.current.pressure,
                            humidity: res.body.current.humidity,
                            windSpeed: res.body.current.wind_speed,
                            description: res.body.current.weather,
                            latitude: res.body.lat,
                            longitude: res.body.lon,
                            hourly: res.body.hourly,
                            daily: res.body.daily
                        })
                    }
                })
            }
        })
    } 
    else{
        response.status(400).send({
            message: "Malformed request"
        })
    }

})

module.exports = router