const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

/**
 * Searche within the members database for tuples that matches the input. 
 * Username, First Name, Last Name, and Email are accepted as input.
 */
router.post('/searchcontacts', (req, res) => {
    let input = req.body['input'];
    let email = req.body['email'];
    db.any(`select memberid, firstname, lastname, username, email from members where email LIKE '%'||$1||'%' OR firstname LIKE '%'||$1||'%' OR lastname LIKE '%'||$1||'%' or username LIKE '%'||$1||'%' except select memberid, firstname, lastname, username, email from members where email = $2`, [input, email]).then(rows => {
        if (rows.length === 0) {
            res.send({
                success:true,
                message:'No Results'
            })
        } else {
            res.send({
                success:true, 
                message:rows
            })
        }
    }).catch(err => {
        res.send({
            success:false,
            message:'Caught: ' + err.message
        })
    })
})

/**
 * Returns the username of the member given their email.
 */
router.post('/getusername', (req, res) => {
    let email = req.body['email'];
    db.one('select username from members where email=$1', [email]).then(row=>{
        res.send({
            success:true,
            message:row
        })
    }).catch(err=> {
        res.send({
            success:false,
            err:err.message
        })
    })
})

/**
 * Returns all of the contacts of the user.
 */
router.post('/getcontacts', (req, res) => {
    let email = req.body['email'];
    db.one('select memberid from members where email=$1', [email]).then(row => {


        db.any('select members.firstname, members.lastname, members.email, members.username from members where members.memberid = any (select memberid_b from contacts where memberid_a=$1 and verified = 1)', [row.memberid]).then(rows => {
            res.send({
                success:true,
                message:rows
            })
        }).catch(err => {
            res.send({
                success:false,
                error:err.message,
                email:email,
                message:"You don't have any contacts. Search and add people you know!"
            })
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err.message,
            email:email,
            message:"This member does not exist or does not have an ID."
        })
    })
})

/**
 * Get pending connection requests. 
 * just pass in the email to see who sent the user a request 
 * and pass in a int for 'pending' to return the requests that user has 
 * sent. 
 */
router.get('/getconnreq', (req, res) => {
    res.type("application/json");
    let email = req.query['email'];
    let pending = req.query['pending'];

    if(!pending){
  
    db.one(`select memberid from members where email = $1`, [email]).then(row => {
        console.log(email);
        console.log(row);
        db.many(`SELECT memberid, firstname, lastname, username, C.memberid_a, C.memberid_b, C.verified
        FROM Members
        JOIN (SELECT memberid_a, memberid_b, verified FROM Contacts WHERE memberid_b = $1 AND verified = 0) as C
        ON memberid_a = memberid`, 
        [row['memberid']]).then(rows => {
            console.log(rows);
            res.send({
                success:true,
                message:rows
                
            })
        }).catch(err => {
            console.log(err);
            res.send({
                success:false, 
                message:'You are all caught up!'
            })
        })
    }).catch(err=>{
        res.send({
            success:false,
            message:'Member DNE'
        })
    })
} else {
    db.one(`select memberid from members where email = $1`, [email]).then(row => {
        console.log(email);
        console.log(row);
        db.many(`SELECT memberid, firstname, lastname, username, C.memberid_a, C.memberid_b, C.verified
        FROM Members
        JOIN (SELECT memberid_a, memberid_b, verified FROM Contacts WHERE memberid_a = $1 AND verified = 0) as C
        ON memberid_b = memberid`, 
        [row['memberid']]).then(rows => {
            console.log(rows);
            res.send({
                success:true,
                message:rows
                
            })
        }).catch(err => {
            console.log(err);
            res.send({
                success:false, 
                message:'You are all caught up!'
            })
        })
    }).catch(err=>{
        res.send({
            success:false,
            message:'Member DNE'
        })
    })
}
})

router.post('/connReq',  (req, res) => {
    let email = req.body['email_a'];
    let receiver = req.body['email_b'];
    db.one('select memberid from members where email = $1', [email]).then(row=>{
        let sender = row.memberid;

        db.one('select memberid from members where email = $1', [receiver]).then(row=>{
            let receiver = row.memberid;
            let insert = 'INSERT INTO Contacts(MemberID_A, MemberID_B, verified) VALUES ($1, $2, 0)';
            let select = 'SELECT * FROM Contacts WHERE MemberID_A = $1 AND MemberID_B = $2';

            db.none(select, [sender, receiver]).then(() =>{
                db.none(insert, [sender, receiver]).then (() => {
                    db.one(select, [sender, receiver]).then(() => {
                        res.send({
                            success:true
                        })
                    }).catch(err => {
                        res.send({
                            success:false,
                            error:err.message,
                            errorTime: 'creating addition'
                        })
                    })
                }).catch(err => {
                    res.send({
                        success:false,
                        error:err.message
                    })
                })
            }).catch(err => {
                res.send({
                    success:false,
                    error:err.message,
                    errorTime: 'get receiver'
                })
            })
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err.message,
            errorTime: 'get sender',
            message:'Member does not exist or member id is missing.',
        })
    })
})

router.post('/convoReq',  (req, res) => {
    let email = req.body['email_a'];
    let receiver = req.body['email_b'];
    db.one('select memberid from members where email = $1', [email]).then(row=>{
        let sender = row.memberid;

        db.one('select memberid from members where email = $1', [receiver]).then(row=>{
            let receiver = row.memberid;
            let insertChat = 'INSERT INTO Chats(approved) VALUES (1) RETURNING chatid)';
            let insertMembers = 'INSERT INTO chatmembers(chatid, memberid) VALUES ($1, $2);';
            let select = 'SELECT * FROM Chats WHERE MemberID_A = $1 AND MemberID_B = $2';
                db.one(insertChat).then (row => {
                    id = row.chatid
                    db.none(insertMembers, [id, sender]).then(() => {
                        db.none(insertMembers, [id, receiver]).then(() => {
                            res.send({
                                success:true
                            })
                        }).catch(err => {
                            res.send({
                                success:false,
                                error:err.message,
                                errorTime: 'insert receiver'
                            })
                        })
                    }).catch(err => {
                        res.send({
                            success:false,
                            error:err.message,
                            errorTime: 'creating addition'
                        })
                })
                }).catch(err => {
                    res.send({
                        success:false,
                        error:err.message,
                        errorTime: 'inserting chat'
                    })
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err.message,
            errorTime: 'get sender',
            message:'Member does not exist or member id is missing.',
        })
    })
})
})



router.post('/connApprove', (req, res) => {
    let sender = req.body['email_a'];
    let receiver = req.body['email_b'];

    let select = 'SELECT verified FROM CONTACTS WHERE MemberID_B = $1 AND MemberID_A = $2';
    let getUserName = 'SELECT memberID FROM members WHERE email = $1'

    db.one(getUserName, [sender]).then( rows =>{
        sender = rows['memberid']
        db.one(getUserName, [receiver]).then ( rows => {
            receiver = rows['memberid']

            db.one(select, [receiver, sender]).then(rows =>{
                let update = 'UPDATE CONTACTS SET verified = 1 WHERE MemberID_B = $1 AND MemberID_A = $2 ';
    
                db.none(update, [receiver, sender]).then( () => {
    
                    res.send({
                        success:true,
                    })
    
                }).catch(err => {
                    res.send({
                        success:false,
                        error:err.message
                    })
                })
            }).catch(err => {
                res.send({
                    success:false,
                    error:err.message
                })
            })
        }).catch(err => {
            res.send({
                success:false,
                error:err.message
            })
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err.message
        })
    })
        
})

router.post('/convoApprove', (req, res) => {
    let sender = req.body['email_a'];
    let receiver = req.body['email_b'];

    let select = `select chatid from chatmembers WHERE 
    memberid = $2 and chatid in(select chatid from chatmembers where memberid = $1)`;
    let getUserName = 'SELECT memberID FROM members WHERE email = $1'

    db.one(getUserName, [sender]).then( rows =>{
        sender = rows['memberid']
        db.one(getUserName, [receiver]).then ( rows => {
            receiver = rows['memberid']

            db.many(select, [receiver, sender]).then(rows =>{
                let update = 'UPDATE CHATS SET approved = 1 WHERE chatID = $1 ';
    
                db.none(update, [rows.chatid]).then( () => {
    
                    res.send({
                        success:true,
                    })
    
                }).catch(err => {
                    res.send({
                        success:false,
                        error:err.message
                    })
                })
            }).catch(err => {
                res.send({
                    success:false,
                    error:err.message
                })
            })
        }).catch(err => {
            res.send({
                success:false,
                error:err.message
            })
        })
    }).catch(err => {
        res.send({
            success:false,
            error:err.message
        })
    })
        
})


router.post('/connSent', (req, res) => {
    let sender = req.body['email'];
    let select = `SELECT memberid, firstname, lastname, username, C.memberid_a, C.memberid_b, C.verified FROM Members
    JOIN (SELECT memberid_a, memberid_b, verified FROM Contacts WHERE memberid_a = $1) as C
    ON memberid_b = memberid`
    let getUserID = 'SELECT memberID FROM members WHERE email = $1'

    db.one(getUserID, [sender]).then(row => {
        memberID = row['memberID'];
        db.many(select, [memberID]).then(rows => {
            if (rows === null) {
                res.send({success: false,
                    message: "No pending contacts!"});
            }
            else {

                
                res.send({success: true,
                    result: rows});
            }
        }).catch(err => {
            res.send({success: false,
                error: err.message,
                time:"Retrieving contacts"});
        })
    }).catch(err => {
        res.send({success: false,
            error: err.message,
            time:"Getting UserID"});
    })

})

router.post('/convoReqSent', (req, res) => {
    let sender = req.body['email'];
    let selectChat = `SELECT A.chatid, A.name, A.approved, U.firstname, U.lastname, U.username FROM chats as A
    JOIN (SELECT chatid, memberid FROM chatmembers WHERE memberid = $1) as C
    ON A.chatid = C.chatid
    JOIN (SELECT chatid, memberid FROM chatmembers) as M
    ON M.chatid = C.chatid
    JOIN (SELECT memberid, firstname, lastname, username, email FROM members) as U
    ON U.memberid = M.memberid`;
    let getUserID = 'SELECT memberID FROM members WHERE email = $1';

    db.one(getUserID, [sender]).then(row => {
        memberID = row['memberID'];

        console.log("Running selectChats on memberID" + memberID)
        db.many(selectChat, [memberID]).then(rows => {

            if (rows === null) {
                res.send({success: false,
                    message: "No pending convos!"});
            }
            else {

                res.send({success: true,
                    result: rows});
            }
        }).catch(err => {
            res.send({success: false,
                error: err.message,
                time:"Retrieving chats"});
        })
    }).catch(err => {
        res.send({success: false,
            error: err.message,
            time:"Getting UserID"});
    })

})

router.post('/convoReqReceived', (req, res) => {
    let sender = req.body['email'];
    let select = `SELECT A.chatid, A.name, A.approved, U.firstname, U.lastname, U.username FROM chats as A
    JOIN (SELECT chatid, memberid FROM chatmembers WHERE memberid = $1) as C
    ON A.chatid = C.chatid
    JOIN (SELECT chatid, memberid FROM chatmembers) as M
    ON M.chatid = C.chatid
    JOIN (SELECT memberid, firstname, lastname, username, email FROM members) as U
    ON U.memberid = M.memberid`;
    let getUserID = 'SELECT memberID FROM members WHERE email = $1'

    db.one(getUserID, [sender]).then(row => {
        memberID = row['memberID'];
        db.many(select, [memberID]).then(rows => {
            if (rows === null) {
                res.send({success: false,
                    message: "No pending convos!"});
            }
            else {
                res.send({success: true,
                    result: rows});
            }
        }).catch(err => {
            res.send({success: false,
                error: err.message,
                time:"Retrieving contacts"});
        })
    }).catch(err => {
        res.send({success: false,
            error: err.message,
            time:"Getting UserID"});
    })

})

router.post('/connReceived', (req, res) => {
    let sender = req.body['email'];
    let select = `SELECT memberid, firstname, lastname, username, C.memberid_a, C.memberid_b, C.verified FROM Members
    JOIN (SELECT memberid_a, memberid_b, verified FROM Contacts WHERE memberid_b = $1) as C
    ON memberid_a = memberid`;
    let getUserID = 'SELECT memberID FROM members WHERE email = $1'

    db.one(getUserID, [sender]).then(row => {
        memberID = row['memberID'];
        db.many(select, [memberID]).then(rows => {
            if (rows === null) {
                res.send({success: false,
                    message: "No pending contacts!"});
            }
            else {
                res.send({success: true,
                    result: rows});
            }
        }).catch(err => {
            res.send({success: false,
                error: err.message,
                time:"Retrieving contacts"});
        })
    }).catch(err => {
        res.send({success: false,
            error: err.message,
            time:"Getting UserID"});
    })

})

module.exports = router;
