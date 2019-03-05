const DARK_SKY_API = 'a574c79fa3aa8048944b142ee613a09b';

const express = require('express');

//request module is needed to make a request to a web service
const requestDark = require('request');

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
 * Returns the 24 hr weather for desired coordindates or location.
 * If location is passed in then first call is made to yahoo API 
 * to retrieve the lat and long of that location then 
 * To the dark sky. If the lat long are originally entered call is 
 * amde directions to dark sky alone. 
 * weather conditions in that. 
 */
router.get("/hourly", (req, res) => {
res.type("application/json");

let desiredLat =  req.query['lat'];
let desiredLong = req.query['lon'];
let desiredLocation = req.query['location'];
let yahooURL =`https://weather-ydn-yql.media.yahoo.com/forecastrss?location=${desiredLocation}&format=json`;
let darkSkyURL= `https://api.darksky.net/forecast/${process.env.DARK_SKY_WEATHER_API}`;

if(desiredLocation) {

   request.get(yahooURL, null, null, (err, data, result) =>{
        if(err) {
            return res.send({
                succes: false,
                msg: "Unable to connect using location"
            });
        } else {

            desiredLat = JSON.parse(data).location.lat;
            desiredLong = JSON.parse(data).location.long;
            darkSkyURL += `/${desiredLat},${desiredLong}`;
            console.log(darkSkyURL);
            console.log(desiredLat, desiredLong);

            requestDark.get(darkSkyURL, (err, response, body) => {
                if(err){
                    return res.send({
                        success: false, 
                        msg: "Unable to retrieve weather from try using lat lon"
                    });
                } else {
                    
                    res.send(body.array());
                }
            }); 
        }
   });   
 } else {
     if(desiredLat && desiredLong) {
    darkSkyURL += `/${desiredLat},${desiredLong}`;
    requestDark.get(darkSkyURL, (err, response, body) => {
            if(err){
                return res.send({
                    success: false, 
                    msg: "Unable to retrieve weather from try using lat lon"
                });
            } else {
                res.send(body);
            }
        }); 
     }
    } 
});




/**
 * Returns the weather for desired coordindates.
 * Takes the lat and long passed in to return 
 * weather conditions in that. 
 */
router.get("/coordinates", (req, res) => {

    
    let desiredLat = req.query['lat'];
    let desiredLong = req.query['lon'];
    let desiredUnits = req.query['u'] || 'f';

    if(!desiredLat || isNaN(desiredLat)) {
        return res.send({
            success: false,
            msg: "Latitude is required as a number"
        });
    } else if (!desiredLong|| isNaN(desiredLong)) {
        return res.send({
            succes: false,
            msg: "Longitude is required as a number"
 
        });
    } 
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
router.put('/location', (req, res) => {
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
        return res.send({
                success: true,
                msg: "Saved your location"
           });
        }).catch((err) => {
            console.log(err);
           return res.send({
                success: false,
                error: err
            });
        });
    }).catch((err) => {
            return res.send({
                success: false, 
                error: "Memebr Id not found"
            });
    });
});

/**
 * Insert users weather locations into the DB. Nickname is the desired 
 * title the user give location. 
 */
router.put('/coordinates', (req, res) => {
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
          return res.send({
                success: true,
                msg: "Saved your location"
           });
        }).catch((err) => {
            console.log(err);
           return res.send({
                success: false,
                error: err
            });
        });
    }).catch((err) => {
        return res.send({
            succes: false,
            error: "Memebr Id not found"
        })
    });
});

/**
 * Remove users saved location from DB, pass in 
 * username and nickname.
 */
router.delete('/location', (req, res) => {
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
    
    db.one("DELETE FROM LOCATIONS WHERE (memberid=$1) AND (nickname=$2) RETURNING *" , [ memberID, nickname])
        .then(() => {
            return res.send({
                success: true,
                msg: "Removed your location"
           });
        }).catch((err) => {
            console.log(err);
          return res.send({
                success: false,
                error: "You do not have a location saved under that nickname"
            });
        }).catch((err) =>{
            res.send({
                success: false, 
                error: "Username not found"
            });
        });
    }).catch((err) => {
        res.send({
            success: false, 
            error: "Memebr Id not found"
        })
    });
});


router.get('/location/users', (req, res) => {
    res.type("application/json");
   /** Parse data */

   let username = req.query['username'];
  
   /**Information required to store users prefered location in DB. */
   if(!username) {
        return res.send({
            success: false,
            msg: "Username required"
        });
   } 
        db.one('SELECT MemberID FROM Members WHERE Username=$1', [username])
        .then(row => {

        var memberID = row['memberid'];

        db.many("SELECT * FROM LOCATIONS WHERE (memberid=$1)" , [memberID])
        .then((data) => {
``
        res.send({
                status: 'Success', 
                data: data,
                message: "Selected saved locations"
        });
    }).catch((err) =>{
        res.send({
            success: false, 
            error: "Username not found"
        });
     });
    }).catch((err) =>{
        return res.send({
            success: false, 
            error: "Member Id not found"
        })
    });
});

  
module.exports = router;


