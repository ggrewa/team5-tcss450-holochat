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

const url3 = 'https://api.openweathermap.org/data/2.5/onecall?lat=47.2529&lon=-122.4443&exclude=minutely,alerts&appid='
/**
 * https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
 */
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
        const url = `https://api.openweathermap.org/data/2.5/weather?zip=`+ zip +`,us&appid=` + process.env.WEATHER_ID

        req({ url: url, json: true }, function (error, res) { 
            if(error){
                response.status(400).send({
                    message: "Error fetching url"
                })
            } else{
                const lat = res.body.coord.lat
                const lon = res.body.coord.lon
                const city = res.body.name
                console.log(city)
                const url2 = `https://api.openweathermap.org/data/2.5/onecall?lat=`+ lat +`&lon=`+ lon +`&exclude={part}&appid=` + process.env.WEATHER_ID

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