//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const router = express.Router()

const nodemailer = require('nodemailer');
//Pull in the JWT module along with out a secret key
const jwt = require('jsonwebtoken')
const config = {
    secret: process.env.JSON_WEB_TOKEN
}
require('dotenv').config();

/**
 * @api {get} /changePassword Sends verification code after verifying email exists
 * @apiName GetchangePassword
 * @apiGroup changePassword
 * 
 * @apiHeader {String} authorization "username" uses Basic Auth 
 * 
 * @apiSuccess {boolean} success true when email is found
 * @apiSuccess {String} message "Authentication successful, Email sent!""
 * @apiSuccess {String} token JSON Web Token
 * 
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "success": true,
 *       "message": "Authentication successful, Email Sent!",
 *       "token": "eyJhbGciO...abc123"
 *     }
 * 
 * @apiError (400: Missing Authorization Header) {String} message "Missing Authorization Header"
 * 
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * 
 * @apiError (404: User Not Found) {String} message "User not found"
 * 
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 * 
 */ 
router.get('/', (request, response, next) => {
    if (isStringProvided(request.headers.authorization) && request.headers.authorization.startsWith('Basic ')) {
        next()
    } else {
        response.status(400).json({ message: 'Missing Authorization Header' })
    }
}, (request, response, next) => {
    // obtain auth credentials from HTTP Header
    const base64Credentials =  request.headers.authorization.split(' ')[1]
    
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')

    const [email] = credentials.split(':')

    if (isStringProvided(email)) {
        request.auth = { 
            "email" : email
        }
        next()
    } else {
        response.status(400).send({
            message: "Malformed Authorization Header"
        })
    }
}, (request, response) => {
    const rand = Math.floor(Math.random() * 8999) + 1000;
    const theQuery = 'UPDATE Members SET code ='+ rand +' WHERE email = $1'
    const values = [request.auth.email]
    pool.query(theQuery, values)
        .then(result => { 
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'User not found' 
                })
                return
            }
            //credentials match. get a new JWT
            let token = jwt.sign({
                "email": request.auth.email
            },
            config.secret,{ 
                expiresIn: '14 days' // expires in 14 days
            })

            //email stuff here!!!
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            });
            const mailConfigurations = {
                from: 'holochat450@gmail.com',
                to: request.auth.email,
                subject: 'Holochat : Password Change', 
                html:   '<h1>We heard you neeeded help.</h1> <br>' +
            
                        '<body>' +
                            'Here is your verification code:<br>' +
                            rand + '<br>' +
                            'Please ignore this email if it was not you.<br><br>' +
                            'Regards, <br>' +
                            'The Holochat team. <br>' +
                        '</body>'
            };

            transporter.sendMail(mailConfigurations, (error, info) => {
                if (error) {
                    console.log('Error:');
                    console.log(error);
                    response.status(400).send({
                        message: "other error, see detail",
                        detail: error.detail
                    })
                } else {
                    console.log('Email sent.');
                    response.status(400).send({
                        message: "Email sent"
                    })
                }
            });

            //package and send the results
            response.json({
                success: true,
                message: 'Authentication successful, Email has been sent!',
                token: token
            })
        })
        .catch((err) => {
            //log the error
            console.log("Error on SELECT************************")
            console.log(err)
            console.log("************************")
            console.log(err.stack)
            response.status(400).send({
                message: err.detail
            })
        })          
})
module.exports = router