const express = require('express');

let db = require('../utilities/utils').db;
var router = express.Router();

var OAuth = require('oauth');
var header = {
    "Yahoo-App-Id": process.env.WEATHER_YAHOO_APP_ID
};

var request = new OAuth.OAuth(
    null,
    null,
    process.env.WEATHER_YAHOO_CLIENT_ID,
    process.env.WEATHER_YAHOO_CLIENT_SECRET,
    '1.0',
    null,
    'HMAC-SHA1',
    null,
    header
);

/**
 * Returns the weather location. 
 * Returns the weather off of zip or city. City and state
 * can be passed in as well to prevent ambiguity. 
 */
router.get("/location", (req, res) => {
    let desiredUnits = req.query['u'] || 'f';
    let desiredLocation = req.query['location'];
  

    request.get(  
    `https://weather-ydn-yql.media.yahoo.com/forecastrss?location=${desiredLocation}&u=${desiredUnits}&format=json`,
    null,
    null,
    function (err, data, result) {
        if (err) {
            console.log(err);      
        } else {
            res.type("application/json");
            res.send(data);
        }
    }
);
});

/**
 * Returns the weather for desired coordindates.
 * Takes the lat and long passed in to return 
 * weather conditions in that. 
 */
router.get("/coordinates", (req, res) => {

    res.type
    let desiredLat = req.query['lat'];
    let desiredLong = req.query['lon'];
    let desiredUnits = req.query['u'] || 'f';

    request.get(  
    `https://weather-ydn-yql.media.yahoo.com/forecastrss?lat=${desiredLat}&lon=${desiredLong}&u=${desiredUnits}&format=json`,
    null,
    null,
    function (err, data, result) {
        if (err) {
            console.log(err);
           
        } else {
            res.type("application/json");
            res.send(data);
        }
    }
); 
});

/**
 * Insert users weather locations into the DB. Nickname is the desired 
 * title the user give location. 
 */
router.get('/get/location', (req, res) => {
    res.type("application/json");
   /** Parse data */

   let username = req.query['username'];
   let zipcode = req.query['location'];
   let nickname = req.query['nickname'] || zipcode;
  
   /**Information required to store users prefered location in DB. */
   if(!username) {
       return res.send({
           success: false,
           msg: "Username required"
       });
   } else if (!zipcode) {
       return res.send({
           succes: false,
           msg: "Location required as zipcode"

       });
   } else if(isNaN(zipcode)) {
        return res.send({
            success: false,
            msg: "Zipcode must be a valid number"
        });
   }

   db.one('SELECT MemberID FROM Members WHERE Username=$1', [username])
    .then(row => {

    var memberID = row['memberid'];
    
    let params = [ memberID, nickname, zipcode];
    db.none("INSERT INTO LOCATIONS(MemberID, nickname, zip) VALUES ($1, $2, $3)", params)
        .then(() => {

           res.send({
                success: true,
                msg: "Saved your location"
           });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
    });
});

/**
 * Insert users weather locations into the DB. Nickname is the desired 
 * title the user give location. 
 */
router.get('/get/coordinates', (req, res) => {
    res.type("application/json");
   /** Parse data */

   let username = req.query['username'];
   let lat = req.query['lat'];
   let lon = req.query['lon'];
   let nickname = req.query['nickname'] || zipcode;
  
   /**Information required to store users prefered location in DB. */
   if(!username) {
       return res.send({
           success: false,
           msg: "Username required"
       });
   } else if(!lat) {
       return res.send({
           succes: false,
           msg: "Location required as latitude"

       });
   } else if(!lon) {
    return res.send({
        succes: false,
        msg: "Location required as longitude"

    });
    }else if(isNaN(lat) || isNaN(lon)) {
        return res.send({
            success: false,
            msg: "Latitude and Longitude must be valid numbers"
        });
   }

   db.one('SELECT MemberID FROM Members WHERE Username=$1', [username])
    .then(row => {

    var memberID = row['memberid'];
    
    let params = [ memberID, nickname, lat, lon];
    db.none("INSERT INTO LOCATIONS(MemberID, nickname, lat, long) VALUES ($1, $2, $3, $4)", params)
        .then(() => {

           res.send({
                success: true,
                msg: "Saved your location"
           });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
    });
});

/**
 * Remove users saved location from DB, pass in 
 * username and nickname.
 */
router.get('/remove', (req, res) => {
    res.type("application/json");
   /** Parse data */

   let username = req.query['username'];
   let nickname = req.query['nickname'];
  
   /**Information required to store users prefered location in DB. */
   if(!username) {
       return res.send({
           success: false,
           msg: "Username required"
       });
   } else if(!nickname) {
    return res.send({
        success: false,
        msg: "Nickname required"
    });
}

   db.one('SELECT MemberID FROM Members WHERE Username=$1', [username])
    .then(row => {

    var memberID = row['memberid'];
    
    let params = [ memberID, nickname];
    db.query("DELETE FROM LOCATIONS WHERE ((memberid=$1) AND (nickname=$2))" , [ memberID, nickname])
        .then(() => {

           res.send({
                success: true,
                msg: "Removed your location"
           });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
    });
});
  
module.exports = router;