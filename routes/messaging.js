const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

// Send a message to all users "in" the chat session with chatId
router.post('/send', (req, res) => {
    let username = req.body['username']; // Sender's username
    let message = req.body['message']; // Sender's message
    let chatId = req.body['chatid']; // Id of the chat room where the message is sent
    if (!username || !message || !chatId) {
        res.send({
            success:false,
            error:'Username, message, or ChatID not supplied.'
        })
        return;
    }
    db.one('select memberid from members where username=$1', [username]).then(member=>{
        //check if the chat exists
        let select = 'SELECT ChatId from Chats where ChatId = $1';
        db.one(select, [chatId]).then(row => {

            let insert = 'INSERT INTO messages (ChatId, Message, memberid) VALUES ($1, $2, $3)';
            db.none(insert, [chatId, message, member.memberid]).then(() => {
                // Send a notification of this message to involved members with registered tokens
                db.any('SELECT * FROM Push_Token where memberid = any (select memberid from chatmembers where chatid=$1) except select * from Push_Token where memberid=$2', [chatId, member.memberid]).then(rows => {
                    rows.forEach(element => {
                        msg_functions.sendToIndividual(element['token'], message, username, chatId);
                    })
                    res.send({
                        success:true,
                        message:"notifications sent"
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
        }).catch(err => {
            res.send({
                success:false,
                error:err
            })
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err,
            errorMsg:"chat does not exist!"
        })
    })
})

//create a new chat. Requires an array of usermnaesmess and a chatid
router.post('/create', (req, res) => {
    let users = req.body['userIds'];
    let chatId = req.body['chatId'];
    let insertChat = 'INSERT INTO chats (chatid) VALUES ($1)';
    let allUsersVerified = 1;
    let getUserID = 'SELECT memberID FROM members WHERE username = $1'
    var userids = [];
        for (i in users) {

            //convert usernames to ids
            db.one(getUserID, users[i]).then( row => {
                userids[i] = row['memberid'];
            }).catch(err => {
                res.send({
                    success:false,
                    error:err.message
                })
            })

            let checkContacts = 'SELECT verified FROM CONTACTS WHERE (memberid_a=$1 AND memberid_b=$2) OR (memberid_a=$2 AND memberid_b=$1)';
            if (userids[i] != userids[0]){
                db.one(checkContacts, [userids[0], userids[i]]).then( row => {
                    let verified = row['verified'];

                    if (verified != 1) {
                        allUsersVerified = 0;
                        res.send({
                            success:false,
                            errMessage:"Users don't exist as contacts!",
                            user1: userids[0],
                            user2: userids[i]
                        })
                    }
                        
                }).catch(err => {
                    allUsersVerified = 0;
                    res.send({
                        success:false,
                        error:err.message,
                        errMessage:"Users don't exist as contacts!",
                        user1: userids[0],
                        user2: userids[i]
                    })
                    
                })
            }
        }

    if (allUsersVerified == 1){
        db.none(insertChat, [chatId]).then (() => {
            for (i in userids) {
                let insertMembers = 'INSERT INTO chatMembers(chatid, memberid) VALUES ($1, $2)'
                        db.none(insertMembers, [chatId, userids[i]]).then( () => {
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
    let email = req.body['email'];
    let chatId = req.body['chatid'];
    let contactemail = req.body['contactemail'];
    if (contactemail) {
        db.one('select memberid, username from members where email=$1', [email]).then(personA=>{
            db.one('select memberid, username from members where email=$1', [contactemail]).then(personB=>{
                db.one('select chatid from chatmembers where memberid=$1 INTERSECT select chatid from chatmembers where memberid=$2', [personA.memberid, personB.memberid]).then(row=>{
                    let chatId = parseInt(row.chatid);
                    let query = `SELECT Members.Username, Messages.chatid, Messages.Message, to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US') AS Timestamp FROM Messages INNER JOIN Members ON Messages.MemberId=Members.MemberId WHERE ChatId=$1 ORDER BY Timestamp ASC`;
                    db.any(query, [chatId]).then(rows => {
                        res.send({
                            success:true,
                            username:personA.username,
                            chatid:chatId, 
                            message:rows
                        })
                    }).catch(err => {
                        res.send({
                            success:false,
                            message:"Have no chat records.",
                            chatid:chatId,
                            error:err
                        })
                    })
                }).catch(err=>{
                    res.send({
                        success:false, 
                        message:"You have not started a chatroom together."
                    })
                })
            }).catch(err=>{
                res.send({
                    success:false,
                    message:"Person B memberid not found."
                })
            })
        }).catch(err=>{
            res.send({
                success:false,
                message:"Person A memberid not found."
            })
        })
    } else if (!contactemail && chatId){
        let query = `SELECT Members.Username, Messages.chatid, Messages.Message, to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US') AS Timestamp FROM Messages INNER JOIN Members ON Messages.MemberId=Members.MemberId WHERE ChatId=$1 ORDER BY Timestamp ASC`;
        db.any(query, [chatId]).then(rows => {
            res.send({
                success:true,
                chatid:chatId, 
                message:rows
            })
        }).catch(err => {
            res.send({
                success:false,
                message:"Have no chat records. Get messages with chat id failed",
                chatid:chatId,
                error:err
            })
        })
    }
})

module.exports = router;