var Pushy = require('pushy');
var pushyAPI = new Pushy(process.env.PUSHY_API_KEY);

// Use to send message to all clients registered to a Topic
function sendToTopic(topic, msg, from) {
    var data = {
        "type":"topic_msg",
        "sender":from, 
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
}

// Use to send message to a specific client by the token
function sendToIndividual(token, msg, from) {
    var data = {
        "type":"msg",
        "sender":from,
        "message":msg
    }
    console.log(data);
    pushyAPI.sendPushNotification(data, token, {}, function(err, id) { // Same as (err, id)) => {} ?
        if (err) {
            return console.log('Fatal Error', err);
        }
        console.log('Push sent successfully! (ID: ' + id + ')');
    })
}

module.exports = {
    sendToTopic, sendToIndividual
};