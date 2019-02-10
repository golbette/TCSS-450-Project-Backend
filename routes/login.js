//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//Pull in the JWT module along with out asecret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

router.post('/', (req, res) => {
    let username = req.body['username'];
    let theirPw = req.body['password'];
    let wasSuccessful = false;
    if(username && theirPw) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT Password, Salt FROM Members WHERE username=$1', [username])
        .then(row => { //If successful, run function passed into .then()
            let active = row['activated']

            let salt = row['salt'];
            //Retrieve our copy of the password
            let ourSaltedHash = row['password']; 
            
            //Combined their password with our salt, then hash
            let theirSaltedHash = getHash(theirPw, salt); 

            //Did our salted hash match their salted hash?
            let wasCorrectPw = ourSaltedHash === theirSaltedHash; 

            if (activated) {
                if (wasCorrectPw) {
                    //credentials match. get a new JWT
                    let token = jwt.sign({username: username},
                        config.secret,
                        { 
                            expiresIn: '24h' // expires in 24 hours
                        }
                    );
                    //package and send the results
                    res.json({
                        success: true,
                        message: 'Authentication successful!',
                        token: token
                    });
                } else {
                    //credentials dod not match
                    res.send({
                        success: false,
                        message: 'credentials did not match'
                    });
                }
            }
            else {
                //password not activated
                res.send({
                    success: false,
                    message: 'please check your email'
                });
            }
        })
        //More than one row shouldn't be found, since table has constraint on it
        .catch((err) => {
            //If anything happened, it wasn't successful
            res.send({
                success: false,
                message: 'unknown error',
                error: err,
                SentEmail: email
            });
        });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});

module.exports = router;
