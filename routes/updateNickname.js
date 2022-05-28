//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const config = {
    secret: process.env.JSON_WEB_TOKEN
}
require('dotenv').config();

const router = express.Router()

router.post('/', (request, response, next) => {

    //Retrieve data from query params
    const verifCode = request.body.verifCode
    const email = request.body.email
    const username = request.body.username
    token = jwt.sign(
        {email: email},
        config.secret,
        { 
            expiresIn: '14 days' // expires in 14 days
        })
    if(isStringProvided(verifCode) && isStringProvided(email) && isStringProvided(username)) {
        let query = 'SELECT code FROM MEMBERS WHERE email =$1'
        let val = [request.body.email]
        pool.query(query, val)
            .then(result => {
                if(verifCode == result.rows[0].code){
                    next();
                } else{
                    response.status(400).send({
                        message: "Verification code does not match."
                    })
                }
            })
            .catch((error) => {
                console.log(error)
                response.status(400).send({
                    message: "other error, see detail",
                    detail: error.detail
                })
            })
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
}, (request, response) => {
    let theQuery = `SELECT memberid FROM Members WHERE email =$1`
    let values = [request.body.email]
    pool.query(theQuery, values)
        .then(result => {
            let query = `UPDATE Members SET username =$1 WHERE memberid=$2`
            let val = [request.body.username, result.rows[0].memberid]
            pool.query(query, val)
            .then(result => {
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
                    to: request.body.email,
                    subject: 'Nickname change', 
                    html:   '<h1>We heard you made a change...</h1> <br>' +
                                            
                    '<body>' +
                    'Your Nickname has been updated.<br><br>' +
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
                response.status(201).send({
                    success: true,
                    email: request.body.email,
                    username: request.body.username
                })
        })
            .catch((error) => {
                response.status(400).send({
                    message: "error in update",
                    detail: error.detail
                })
            })
        })
        .catch((error) => {
            console.log(error)
            response.status(400).send({
                message: "error in select",
                detail: error.detail
            })
        })
})


module.exports = router