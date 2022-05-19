//express is the framework we're going to use to handle requests
const express = require('express')
const httpProxyClient = require('nodemailer/lib/smtp-connection/http-proxy-client')
//Create a new instance of express
const app = express()

//Access the connection to Heroku Database
const pool = require('./utilities').pool

let middleware = require('./middleware')

/*
 * This middleware function parses JASOn in the body of POST requests
 */
app.use(express.json())

/*
 * This middleware function will respond to improperly formed JSON in 
 * request parameters.
 */
app.use(middleware.jsonErrorInBody)

app.use('/auth', require('./routes/signin.js'))

app.use('/auth', require('./routes/register.js'))

app.use('/service', require('./routes/verification.js'))

app.use('/changePassword', require('./routes/sendVerifCode.js'))

app.use('/changePassword', require('./routes/updatePassword.js'))

//app.use('/contacts', middleware.checkToken,  require('./routes/contacts.js'))
app.use('/contacts', require('./routes/contacts.js'))
/*
 * Return HTML for the / end point. 
 * This is a nice location to document your web service API
 * Create a web page in HTML/CSS and have this end point return it. 
 * Look up the node module 'fs' ex: require('fs');
 */
app.get("/", (request, response) => {

    //this is a Web page so set the content-type to HTML
    response.writeHead(200, {'Content-Type': 'text/html'});
    //write a response to the client
    response.write('<h1 style="color:DeepSkyBlue">THE 450 EXPERIENCE:</h1><br>');
    response.write('<img src = "https://i.pinimg.com/564x/2b/fd/b9/2bfdb98d255a886a24a0ee736497eb1e.jpg" width = "500"/><br>');
    response.write('<img src = "https://i.pinimg.com/564x/62/c8/0f/62c80f457fc04e7f709f5d181a854af9.jpg" width = "500"/><br>'); 
    response.write('<img src = "https://i.imgflip.com/3si37c.jpg" width = "500"/>'); 
    response.end(); //end the response
});

/*
 * Serve the API documentation generated by apidoc as HTML. 
 * https://apidocjs.com/
 */
app.use("/doc", express.static('apidoc'))

/* 
* Heroku will assign a port you can use via the 'PORT' environment variable
* To access an environment variable, use process.env.<ENV>
* If there isn't an environment variable, process.env.PORT will be null (or undefined)
* If a value is 'falsy', i.e. null or undefined, javascript will evaluate the rest of the 'or'
* In this case, we assign the port to be 5000 if the PORT variable isn't set
* You can consider 'let port = process.env.PORT || 5000' to be equivalent to:
* let port; = process.env.PORT;
* if(port == null) {port = 5000} 
*/ 
app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});