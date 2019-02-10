//express is the framework we're going to use to handle requests
const express = require('express');

//retrieve the router pobject from express
var router = express.Router();

//add a get route to the router. 
router.get("/", (req, res) => {
    res.send({
        message: "Hello, you sent a GET request"
    });
});

//add a post route to the router.
router.post("/", (req, res) => {
    res.send({
        message: "Hello, you sent a POST request"
    });
});

// "return" the router
module.exports = router;
