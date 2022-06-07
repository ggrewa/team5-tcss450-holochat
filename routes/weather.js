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

/**
 * @api {get} /auth Request to get weather for a zipcode or lat and lon
 * @apiName weather
 * @apiGroup weather
 * 
 * @apiSuccess {boolean} success true when weather is found
 * @apiSuccess {String} token JSON Web Token
 * 
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "success": true,
 *       "tempC": 50,
 *       ...
 *     }
 * 
 * @apiError (400: Missing Authorization Header) {String} message "Error fetching url"
 * 
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed request"
 * 
 */
router.get("/:location?", (request, response, next) => {
    if (!isStringProvided(request.params.location)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next();
    }

}, (request, response) => {
    //check zip code
    if (request.params.location.length == 5) {
        let zip = request.params.location
        const url = `https://www.zipcodeapi.com/rest/` + process.env.ZIP_ID + `/info.json/` + zip + `/degrees`
        req({ url: url, json: true }, function (err, resp) {
            if (err) {
                response.status(400).send({
                    message: "Error fetching url"
                })
            } else {
                //check for error in the body!
                if (isUndefined(resp.body.lat) || isUndefined(resp.body.lng) || isUndefined(resp.body.city)) {
                    response.status(400).send({
                        message: "Missing required information: either body lat, lng or city from zip code?"
                    })
                } else {
                    let lat = resp.body.lat;
                    let lon = resp.body.lng;
                    let city = resp.body.city;

                    const url2 = `https://api.openweathermap.org/data/2.5/onecall?lat=` + lat + `&lon=` + lon + `&appid=` + process.env.WEATHER_ID

                    req({ url: url2, json: true }, function (error, res) {
                        if (error) {
                            response.status(400).send({
                                message: "Error fetching url"
                            })
                        } else {
                            //make sure the body is defined otherwise the service will crash!
                            if (isUndefined(res.body.current.temp) ||
                                isUndefined(res.body.current.feels_like) ||
                                isUndefined(res.body.current.pressure) ||
                                isUndefined(res.body.current.humidity) ||
                                isUndefined(res.body.current.wind_speed) ||
                                isUndefined(res.body.lat) ||
                                isUndefined(res.body.lon) ||
                                isUndefined(res.body.hourly) ||
                                isUndefined(res.body.daily)
                            ) {
                                response.status(400).send({
                                    message: "Missing required body information to view weather info from openweather api"
                                })
                            } else { //everything is defined go ahead and send response
                                response.json({
                                    success: true,
                                    city: city,
                                    tempC: (res.body.current.temp - 273.15),
                                    tempF: 1.8 * (res.body.current.temp - 273.15) + 32,
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
                        }
                    })
                }
            }
        })
    } else if (request.params.location.length > 5) {
        const [lat, lon] = request.params.location.split(':')
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=` + lat + `&lon=` + lon + `&appid=` + process.env.WEATHER_ID

        req({ url: url, json: true }, function (error, res) {
            if (error) {
                response.status(400).send({
                    message: "Error fetching url"
                })
            } else {
                //make sure the body is defined otherwise the service will crash!
                if (isUndefined(res.body.current.temp) ||
                    isUndefined(res.body.current.feels_like) ||
                    isUndefined(res.body.current.pressure) ||
                    isUndefined(res.body.current.humidity) ||
                    isUndefined(res.body.current.wind_speed) ||
                    isUndefined(res.body.lat) ||
                    isUndefined(res.body.lon) ||
                    isUndefined(res.body.hourly) ||
                    isUndefined(res.body.daily)
                ) {
                    response.status(400).send({
                        message: "Missing required body information to view weather info from openweather api"
                    })
                } else { //everything is defined go ahead and send response
                    response.json({
                        success: true,
                        tempC: (res.body.current.tempoo - 273.15),
                        tempF: 1.8 * (res.body.current.temp - 273.15) + 32,
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
            }
        })
    }
    else {
        response.status(400).send({
            message: "Malformed request"
        })
    }

})

module.exports = router

/**helper method to check undefined */
function isUndefined(theThing) {
    return theThing === undefined;
}