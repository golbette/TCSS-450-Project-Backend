//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();

let middleware = require('./utilities/middleware');

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
app.use(bodyParser.json());


app.use('/register', require('./routes/register.js'));
app.use('/login', require('./routes/login.js'));
app.use('/verify', require('./routes/verify.js'));

app.use('/pushy', require('./routes/pushy.js'));
// app.use('/pushy', middleware.checkToken, require('./routes/pushy.js'));
app.use('/messaging', require('./routes/messaging.js'));
// app.use('/messaging', middleware.checkToken, require('./routes/messaging.js'));

/** Use middle ware after merged with master for testing */
// app.use('/weather',middleware.checkToken ,require('./routes/weather.js'));
app.use('/weather', require('./routes/weather.js'));


/*N
* Hello world functions below...
*/
app.get("/hello", (req, res) => {
    res.send({
    message: "Hello, you sent a GET request"});
    });
    app.post("/hello", (req, res) => {
    res.send({
    message: "Hello, you sent a POST request"
    });
    })
        app.post("/demosql", (req, res) => {
            var name = req.body['name'];
        
            if (name) {
                db.none("INSERT INTO DEMO(Text) VALUES ($1)", name)
                .then(() => {
                    //We successfully added the name, let the user know
                    res.send({
                        success: true
                    });
                }).catch((err) => {
                    //log the error
                    console.log(err);
                    res.send({
                        success: false,
                        error: err
                    });
                });
            } else {
                res.send({
                    success: false,
                    input: req.body,
                    error: "Missing required information"
                });
            }
        });
        
        app.get("/demosql", (req, res) => {
        
            db.manyOrNone('SELECT Text FROM Demo')
            //If successful, run function passed into .then()
            .then((data) => {
                res.send({
                    success: true,
                    names: data
                });
            }).catch((error) => {
                console.log(error);
                res.send({
                    success: false,
                    error: error
                })
            });
        });      

/*
 * Return HTML for the / end point. 
 * This is a nice location to document your web service API
 * Create a web page in HTML/CSS and have this end point return it. 
 * Look up the node module 'fs' ex: require('fs');
 */
app.get("/", (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    for (i = 1; i < 7; i++) {
        //write a response to the client
        res.write('<h' + i + ' style="color:blue">Hello World!</h' + i + '>'); 
    }
    res.end(); //end the response
});

/* 
* Heroku will assign a port you can use via the 'PORT' environment variable
* To accesss an environment variable, use process.env.<ENV>
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