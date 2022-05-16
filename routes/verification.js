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