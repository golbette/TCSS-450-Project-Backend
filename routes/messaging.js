const express = require('express');
let db = require('../utilities/util.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/util.js').messaging;

// Send a message to all users "in" the chat session with chatId
router.post('/send', (req, res) => {
    let email = req.body['email'];
    let message = req.body['message'];
    let chatId = req.body['chatId'];
    let 
    if (!email || !message || !chatId) {
        res.send({
            success:false,
            error:'Email, message, or ChatID not supplied.'
        })
        return;
    }
    
    //check if the chat exists. TODO: create a separate endpoint for creating a chat
    let select = 'SELECT ChatId from Chats where ChatId = $1'
    db.one(select, [chatId]).then((row => {

        let insert = 'INSERT INTO Messages(ChatId, Message, MemberId) SELECT $1, $2, MemberId From Members Where Email=$3';
        db.none(insert, [chatId, message, email]).then(() => {
        // Send a notification of this message to ALL members with registered tokens
            db.manyOrNone('SELECT * FROM Push_Token').then(rows => {
                rows.forEach(element => {
                    msg_functions.sendToIndividual(element['token'], message, email);
                })
                res.send({
                    success:true
                })
            }).catch(err => {
                res.send({
                    success:false,
                    error:err
                })
            })
        }).catch(err => {
            res.send({
                success:false,
                error:err
            })
        })

    })).catch(err => {
        res.send({
            success:false,
            error:err
        })
    })
    
})

router.post('/create', (req, res) => {
    let users = req.body['userIds'];
    let chatId = req.body['chatId'];
    let otherMemberId = req.body['otherMemberId'];

    let query = 'INSERT INTO Chats($1, $2)'

    for (i in users) {
        db.none(query, [chatId, i]).then( () => {
            res.send({
                success:true
            })
        }).catch(err => {
            res.send({
                success:false,
                error:err
            })
            
        })
    }

})

// Get all of the messages from a chat session with id chatId
router.post('/getAll', (req, res) => {
    let chatId = req.body['chatId'];
    let query = `SELECT Members.Email, Messages.Message, to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US') AS Timestamp FROM Messages INNER JOIN Members ON Messages.MemberId=Members.MemberId WHERE ChatId=$1 ORDER BY Timestamp ASC`;
    db.manyOrNone(query, [chatId]).then(rows => {
        res.send({
            message:rows
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err
        })
    })
})

module.exports = router;