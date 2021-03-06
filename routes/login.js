//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

var router = express.Router();

let sendResetPasswordEmail = require('../utilities/utils').sendResetPasswordEmail;

//This allows parsing of the body of POST requests, that are encoded in JSON
const bodyParser = require("body-parser");

//We use this create the SHA256 hash
const crypto = require("crypto");

router.use(bodyParser.json());

//Pull in the JWT module along with our secret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

router.post('/', (req, res) => {
    let email = req.body['email'];
    let theirPw = req.body['password'];
    let wasSuccessful = false;
    if(email && theirPw) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT Password, Salt, Activated, Username FROM Members WHERE email=$1', [email])
        .then(row => { //If successful, run function passed into .then()
            let active = row['activated']
            let salt = row['salt'];
            //Retrieve our copy of the password
            let ourSaltedHash = row['password']; 
            let username = row['username'];  
            //Combined their password with our salt, then hash
            let theirSaltedHash = getHash(theirPw, salt); 
            //Did our salted hash match their salted hash?
            let wasCorrectPw = ourSaltedHash === theirSaltedHash; 
            if (active === 1) {
                if (wasCorrectPw) {
                    //credentials match. get a new JWT
                    let token = jwt.sign({email: email},
                        config.secret,
                        { 
                            expiresIn: '24h' // expires in 24 hours
                        }
                    );
                    //package and send the results
                    res.json({
                        success: true,
                        message: 'Authentication successful!',
                        token: token,
                        username: username
                    });
                } else {
                    //credentials dod not match
                    res.send({
                        success: false,
                        message: 'Credentials did not match'
                    });
                }
            } else {
                //password not activated
                res.send({
                    success: false,
                    message: 'Please check your email'
                });
            }
        }).catch((err) => { //More than one row shouldn't be found, since table has constraint on it
            //If anything happened, it wasn't successful
            res.send({
                success: false,
                message: 'Credentials did not match',
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            message: 'Missing credentials'
        });
    }
});

//Endpoint for "Reset Password"
//Pre: email for account to reset is provided, along with the new password
//Post: The new password becomes the account's password
router.post("/resetpw", (req, res) => {
    let email = req.body['email'];
    let oldpw = req.body['oldpassword'];
    let newpw = req.body['newpassword'];
    // let select = 'SELECT memberID FROM members WHERE email = $1';
    db.one('SELECT Password, Salt, Activated, firstname, Memberid FROM Members WHERE email=$1', [email]).then(row => {
        let saltedPassword = row.password;
        let saltedOldpw = getHash(oldpw, row.salt);

        if (saltedOldpw === saltedPassword) {
            let saltedNewpw = getHash(newpw, row.salt);

            db.none('UPDATE members SET password = $1 WHERE email = $2', [saltedNewpw, email]).then(() => {
                res.send({
                    "success" : true
                })
            }).catch(err => {
                res.send({
                    "success" : false,
                    "error" : err.message,
                    "time" : "Update row"
                })
            })
        }
    }).catch(err => {
        res.send({
            "success" : false,
            "error" : err.message,
            "time" : "get user"
        })
    })
})

//Endpoint for "Forgot Password"
//Pre: email for account to reset is provided
//Post: An email with a new, random password is sent to the account, 
//and that password becomes the account's password
router.post("/forgotpw", (req, res) => {
    let email = req.body['email'];
    db.one('SELECT Password, Salt, Activated, firstname, Memberid FROM Members WHERE email=$1', [email]).then(row => {
        let salt = row['salt'];

        //generate a random new password using hexcode from before
        let hex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F'];
        let pw = '';
        for (let i = 0; i < 8; i++) {
            pw = pw + hex[Math.floor(Math.random() * 16)];
        }
        //Combined their password with our salt, then hash
        let newSaltedHash = getHash(pw, salt); 
        let first = row.firstname;
        //update table and send email
        db.none('UPDATE members SET password = $1 WHERE memberid = $2', [newSaltedHash, row.memberid]).then(() => {
            sendResetPasswordEmail("uwnetid@uw.edu", email, first + ", You've Requested a Password Reset", pw);
            res.send({
                "success" : true
            })
        }).catch(err => {
            res.send({
                "success" : false,
                "err" : err.message,
                "time" : "Update table"
            })
        })
    }).catch((err) => { //More than one row shouldn't be found, since table has constraint on it
        //If anything happened, it wasn't successful
        res.send({
            success: false,
            message: 'Credentials did not match',
            error: err
        });
    });
})

module.exports = router;
