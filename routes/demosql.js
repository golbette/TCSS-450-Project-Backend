//express is the framework we're going to use to handle requests
const express = require('express');

//pg-promise is a postgres library that uses javascript promises
const pgp = require('pg-promise')();
//We have to set ssl usage to true for Heroku to accept our connection
pgp.pg.defaults.ssl = true;

//Create connection to Heroku Database
let db;

db = pgp('postgres://mrreyoiakxxthz:032b6735b13f961d72860a70558faf6a4559e1d0ea72fbbbd73e0d7a77d2f616@ec2-107-21-99-237.compute-1.amazonaws.com:5432/defj80b5qmhr5d');

if(!db) {
   console.log("SHAME! Follow the instructions and set your DATABASE_URL correctly");
   process.exit(1);
}

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post("/", (req, res) => {
    var name = req.body['name'];

    if (name) {
        db.none("INSERT INTO DEMO(Text) VALUES ($1)", name)
        .then(() => {
            //We successfully addevd the name, let the user know
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

router.get("/", (req, res) => {

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

module.exports = router;
