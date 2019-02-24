const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

// Send a message to all users "in" the chat session with chatId
router.post('/send', (req, res) => {
    let email = req.body['email'];
    let message = req.body['message'];
    let chatId = req.body['chatId'];
    if (!email || !message || !chatId) {
        res.send({
            success:false,
            error:'Email, message, or ChatID not supplied.'
        })
        return;
    }
    
    //check if the chat exists
    let select = 'SELECT ChatId from Chats where ChatId = $1'
    db.one(select, [chatId]).then((row => {

        let insert = 'INSERT INTO Messages(ChatId, Message, userId) SELECT $1, $2, userId From Members Where Email=$3';
        db.none(insert, [chatId, message, email]).then(() => {
        // Send a notification of this message to ALL members with registered tokens
            //db.manyOrNone('SELECT * FROM Push_Token').then(rows => {
            //    rows.forEach(element => {
            //        msg_functions.sendToIndividual(element['token'], message, email);
            //    })
            //    res.send({
            //       success:true
            //    })
           // }).catch(err => {
           //     res.send({
           //         success:false,
           //         error:err
           //     })
           // })
        }).catch(err => {
            res.send({
                success:false,
                error:err
            })
        })

    })).catch(err => {
        res.send({
            success:false,
            error:err,
            errorMsg:"chat does not exist!"
        })
    })
    
})

//create a new chat. Requires an array of userIds and a chatid

router.post('/create', (req, res) => {
    let users = req.body['userIds'];
    let chatId = req.body['chatId'];

    let initiatingUser = users[0];
    let insertChat = 'INSERT INTO chats (chatid) VALUES ($1)';



    let allUsersVerified = 1;
        for (i in users) {

            let checkContacts = 'SELECT verified FROM CONTACTS WHERE (memberid_a=$1 AND memberid_b=$2) OR (memberid_a=$2 AND memberid_b=$1)'

        if (i != initiatingUser){
            db.one(checkContacts, [initiatingUser, i]).then( rows => {
                let verified = rows[verified];

                if (verified != 1) {
                    allUsersVerified = 0;
                }

                else {
                    res.send({
                        success:false,
                        error:"Users don't exist as contacts!",
                        errMessage: "Users don't exist as contacts!"
                    })
                    return;
                }
                    
            }).catch(err => {
                res.send({
                    success:false,
                    error:err.message,
                    errMessage:"Users don't exist as contacts!"

                })
                allUsersVerified = 0;
            })
        }
    }

    if (allUsersVerified == 1){
            db.none(insertChat, [chatId, i]).then (() => {
                for (i in users) {
                    let insertMembers = 'INSERT INTO chatMembers(chatid, memberid) VALUES ($1, $2)'
                            db.none(insertMembers, [chatId, i]).then( () => {
                            res.send({
                            success:true
                            })
                        }).catch(err => {
                            res.send({
                             success:false,
                             error:err.message
                        })
                    })
                }
            })
    }

        
})

// Get all of the messages from a chat session with id chatId
router.post('/getAll', (req, res) => {
    let chatId = req.body['chatId'];
    let query = "SELECT Members.Email, Messages.Message, to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US') AS Timestamp FROM Messages INNER JOIN Members ON Messages.MemberId=Members.MemberId WHERE ChatId=$1 ORDER BY Timestamp ASC`";
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