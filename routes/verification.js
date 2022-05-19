const { response } = require('express')
const { request } = require('express')
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const jwt = require('jsonwebtoken');
const config = {
    secret: process.env.JSON_WEB_TOKEN
}
let path = require('path');

const router = express.Router()
const bodyParser = require("body-parser");
router.use(bodyParser.json());

/**
 * @api {get} /service Sends verification code after verifying email exists
 * @apiName GetService
 * @apiGroup service
 * 
 * @apiSuccess {boolean} success true when email is found
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
 * @apiError (404: User Not Found) {String} message "User not found"
 * 
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 * 
 * @apiError (400: Invalid Credentials) {String} message "Email already verified"
 * 
 */
router.get('/', (request, response) => {
    let decodedJwt = jwt.decode(request.query.token)
    let email = decodedJwt.email
    let theQuery = 'SELECT * FROM Members WHERE email = $1 AND verification = 0'
    let values = [email]
    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'User not found', 
                    detail: error.detail
                })
                return
            }
            let verifQuery = 'UPDATE Members SET verification = 1 WHERE email = $1'
            let theValues = [email]
            pool.query(verifQuery, theValues)
                .then(result => {
                    response.redirect('http://' + request.headers['host'] + '/service/success')
                })
                .catch(result => {
                    response.status(400).send({
                        message: "other error, see detail",
                        detail: error.detail
                    })
                })
            
         })
        .catch((error) => {
            response.status(400).send({
                message: "Email already verified"
            })
        })
})

router.get('/success', (request, response) => {
    response.sendFile(path.join(__dirname + '/verificationSuccess.html'));
})

module.exports = router