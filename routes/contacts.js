const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

router.post('/searchcontacts', (req, res) => {
    let input = req.body['input'];
    db.any(`select memberid, firstname, lastname, username, email from members where email LIKE '%'||$1||'%' OR firstname LIKE '%'||$1||'%' OR lastname LIKE '%'||$1||'%' or username LIKE '%'||$1||'%'`, [input]).then(rows => {
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

router.post('/getusername', (req, res) => {
    let email = req.body['email'];
    db.one('select username from members where email=$1', [email]).then(row=>{
        res.send({
            success:true,
            message:row
        })
    }).catch(err=>{
        res.send({
            success:false,
            err:err.message
        })
    })
})

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

router.post('/getconnreq', (req, res) => {
    let email = req.body['email'];
    db.one('select memberid from members where email = $1', [email]).then(row=>{
        db.any('select firstname, lastname, memberid from members where memberid = any (select memberid_a from contacts where memberid_b=$1)', [row.memberid]).then(rows=>{
            res.send({
                success:true,
                message:rows
            })
        }).catch(err => {
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
})

router.post('/request',  (req, res) => {
    let email = req.body['email'];
    let receiver = req.body['MemberID_B'];
    db.one('select memberid from members where email = $1', [email]).then(row=>{
        let sender = row.memberid;
        let insert = 'INSERT INTO Contacts(MemberID_A, MemberID_B, verified) VALUES ($1, $2, 0)';
        let select = 'SELECT * FROM Contacts WHERE MemberID_A = $1 AND MemberID_B = $2';
        let success = true;

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
    }).catch(err => {
        res.send({
            success:false,
            error:err.message,
            errorTime: 'get sender',
            message:'Member does not exist or member id is missing.',
        })
    })
})

router.get('/list', (req, res) => {
    let contactQuery = 'SELECT memberid_a, memberid_b FROM CONTACTS WHERE (MemberID_A = $1 OR MemberID_B = $1) AND verified = 1';
    let user = req.body['Username'];
    var contactInfos = [];
    var contactIDs = [];
    let getUserID = 'SELECT memberID FROM members WHERE username = $1'

    db.one(getUserID, [user]).then(row => {

        let user = row['memberid']
        db.manyOrNone(contactQuery, [user]).then(rows => {
            let members_a = rows['memberid_a'];
            let members_b = rows['memberid_b'];
            
            console.log(members_a);
            console.log(members_b);
            console.log(rows);

            let userNameQuery = 'SELECT username FROM members WHERE memberID = $1';

            for (i in members_a){
                if (members_a[i] != user) {
                    contactIDs.push(members_a[i]);
                }
            }

            for (i in members_b){
                if (members_b[i] != user) {
                    contactIDs.push(members_b[i]);
                }
            }

            for (i in contactIDs) {
                //by definition there should only be one user per contact id
                db.one(userNameQuery, [contactIDs[i]]).then(row => {
                    name = row['username'];
                    contactInfos.push(name);
                }).catch( err => {
                    res.send({
                        success:false,
                        error: err.message
                    })
                })
            }
        }).catch( err => {
            res.send({
                success:false,
                error: err.message
            })
        })

        res.send({
            success:true,
            usernames: contactInfos,
            userids: contactIDs,
            requester: user,
        })

    }).catch(err => {
        res.send({
            success:false,
            error:err.message
        })
    })

        

})


router.post('/approve', (req, res) => {
    let sender = req.body['Username_A'];
    let receiver = req.body['Username_B'];

    let select = 'SELECT verified FROM CONTACTS WHERE MemberID_B = $1 AND MemberID_A = $2';
    let getUserName = 'SELECT memberID FROM members WHERE username = $1'

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

module.exports = router;
