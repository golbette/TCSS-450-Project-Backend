var Pushy = require('pushy');
var pushyAPI = new Pushy(process.env.PUSHY_API_KEY);


const express = require('express');
let db = require('./utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Use to send message to all clients registered to a Topic
function sendToTopic(topic, msg, from) {
    db.one('select username from members where email=$1', [from]).then(row=>{
        var data = {
            "type":"topic_msg",
            "sender":row.username, 
            "message":msg
        }
        console.log(data);
        to = '/topics/' + topic;

        // Send push notification via the Send Notifications API
        // https://pushy.me/docs/api/send-notifications
        pushyAPI.sendPushNotification(data, to, {}, function(err, id) { // Same as (err, id)) => {} ?
            if (err) {
                return console.log('Fatal Error', err);
            }
            console.log('Push sent successfully! (ID: ' + id + ')');
        })
    })
}

// Use to send message to a specific client by the token
function sendToIndividual(token, msg, from) {
    db.one('select username from members where email=$1', [from]).then(row=>{
        var data = {
            "type":"msg",
            "sender":row.username,
            "message":msg
        }
        console.log(data);
        pushyAPI.sendPushNotification(data, token, {}, function(err, id) { // Same as (err, id)) => {} ?
            if (err) {
                return console.log('Fatal Error', err);
            }
            console.log('Push sent successfully! (ID: ' + id + ')');
        })
    }).catch(err =>{
        console.log(err);
    })
}

module.exports = {
    sendToTopic, sendToIndividual
};