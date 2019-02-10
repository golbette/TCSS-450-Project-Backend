//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.get('/', (req, res) => {
    let linkVerificationHex = req.query['id'];
    let email = req.query['email'];
    
    
    //Using the 'one' method means that only one row should be returned
    db.one('SELECT VerificationHex FROM Members WHERE Email=$1', [email])
    .then(row => { //If successful, run function passed into .then()
        let dbVerificationHex = row['verificationhex'];
        console.log("link: " + linkVerificationHex + " db: " + dbVerificationHex);
        if (dbVerificationHex === linkVerificationHex) {

            // Email token matched with token in db, now set activation to 1
            db.none('UPDATE Members SET Activated = 1 WHERE Email=$1', [email])
            .then(() => {
                res.write("Account Verified!");
                res.end();
                console.log("verify token: " + linkVerificationHex + " email: " + email);
            })
            .catch((error) => {
                console.log(error);
            }); 
        }
    })
    .catch((error) => {
        console.log(error);
    })
});

module.exports = router;