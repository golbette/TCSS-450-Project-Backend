//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('../utilities/utils').db;

//retrieve the router pobject from express
var router = express.Router();


router.get("/", (req, res) => {
    setTimeout(() => {
        res.send({
            message: "Thanks for waiting"
        });
    }, 1000)});

router.post("/params", (req, res) => {

    res.send({
        //req.query is a reference to arguments in the POST body
        message: "Hello, " + req.body['name'] + "! You sent a POST Request"
    });
});
    

module.exports = router;
