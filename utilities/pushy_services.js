var Pushy = require('pushy');
var pushyAPI = new Pushy(process.env.PUSHY_API_KEY);
/** REQUEST_ID is reserved for connection and conversation requests. */
const REQUEST_ID = 21;

// Use to send message to all clients registered to a Topic
function sendToTopic(topic, msg, from, chatId) {
    var data = {
        "type":"topic_msg",
        "sender":from, 
        "message":msg,
        "chatid":chatId
    }
    console.log(data);
    to = '/topics/' + topic;

    // Send push notification via the Send Notifications API
    // https://pushy.me/docs/api/send-notifications
    pushyAPI.sendPushNotification(data, to, {}, function(err, id) {
        if (err) {
            return console.log('Fatal Error', err);
        }
        console.log('Push sent successfully! (ID: ' + id + ')');
    })
}

// Use to send message to a specific client by the token
function sendToIndividual(token, msg, from, chatId) {
    var type;
    if (chatId === REQUEST_ID) {
        type = "req";
    } else {
        type = "msg";
    }
    var data = {
        "type":type,
        "sender":from,
        "message":msg, 
        "chatid":chatId
    }
    console.log(data);
    pushyAPI.sendPushNotification(data, token, {}, function(err, id) {
        if (err) {
            return console.log('Send To Individual / Send Push Notification - Fatal Error', err);
        }
        console.log('Push sent successfully! (ID: ' + id + ')');
    })
}

// function sendRequestNotification(token, from, to, type) {
//     var data = {
//         "type":type,
//         "sender":from, 
//         "receiver":to,
//     }
//     console.log(data);
//     pushyAPI.sendPushNotification(data, token, {}, function(err, id) {
//         if (err) {
//             return console.log('Fatal Error', err);
//         }
//         console.log('Request - Push sent successfully! (ID: ' + id + ')');
//     })
// }

module.exports = {
    sendToTopic, sendToIndividual
};