const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

/**
 * Gets the count of notifications based on the type of notifications.
 * For getting connreq notifications or convoreq notifications, provide type, and email_b
 * For getting chat notifications, provide type, chatid, and email_b
 */
router.post('/getcount', (req, res) => {
    let type = req.body['notetype']; // type of requests
    let chatid = req.body['chatid']; // chatid (if it's a msg notification)
    let email_a = req.body['email_a']; // Sender's email
    let email_b = req.body['email_b']; // Receiver's email

    // if (type === 'msg') {
        db.any(`select chatid, count(notificationid) from notifications where notetype = 'msg' and email_b = $1 group by chatid`, [email_b]).then(msgCount=>{
            db.one(`select count(notificationid) from notifications where notetype = 'connreq' and email_b = $1`, [email_b]).then(connCount=>{
                db.one(`select count(notificationid) from notifications where notetype = 'convoreq' and email_b = $1`, [email_b]).then(convoCount=>{
                    res.send({
                        "success":true,
                        "msgCount":msgCount,
                        "connCount":connCount.count,
                        "convoCount":convoCount.count
                    })
                }).catch(err=>{
                    res.send({
                        "success":false, 
                        "message":"error counting num of convoreqs " + err.message
                    })
                })
            }).catch(err=>{
                res.send({
                    "success":false, 
                    "message":"error counting num of connreqs " + err.message
                })
            })
        }).catch(err=>{
            res.send({
                "success":false, 
                "message":"error counting num of msg " + err.message
            })
        })
    // }
})

router.post('/clearnotification', (req, res) => {
    let type = req.body['notetype']; // type of requests
    let chatid = req.body['chatid']; // chatid (if it's a msg notification)
    let email_a = req.body['email_a']; // Sender's email
    let email_b = req.body['email_b']; // Receiver's email

    if (type === 'msg') {
        db.none(`delete from notifications where notetype = 'msg' and email_b = $1 and chatid = $2`, [email_b, chatid]).then(()=>{
            res.send({
                "success":true
            })
        })
    } else {
        db.none(`delete from notifications where notetype = 'connreq' and email_b = $1`, [email_b]).then(()=>{
            db.none(`delete from notifications where notetype = 'convoreq' and email_b = $1`, [email_b]).then(()=>{
                res.send({
                    "success":true
                })
            })
        })
    }
})

module.exports = router;