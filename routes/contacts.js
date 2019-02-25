const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

router.post('/request',  (req, res) => {
    let sender = req.body['Username_A'];
    let receiver = req.body['Username_B'];
    let insert = 'INSERT INTO Contacts(MemberID_A, MemberID_B, verified) VALUES ($1, $2, 0)';
    let select = 'SELECT * FROM Contacts WHERE MemberID_A = $1 AND MemberID_B = $2';
    let success = true;


    let getUserName = 'SELECT memberID FROM members WHERE username = $1'

    db.one(getUserName, [sender]).then(row => {
        sender = row['memberid']
        db.one(getUserName, [receiver]).then(row => {
            receiver = row['memberid']
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
                            errorTime: 'checking addition'
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
            sender: req.body['Username_A']
        })
    })

        

    
})

router.get('/list', (req, res) => {
    let contactQuery = 'SELECT memberid_a, memberid_b FROM CONTACTS WHERE (MemberID_A = $1 OR MemberID_B = $1) AND verified = 1';
    let user = req.body['Username'];
    var contactInfos = [];
    let getUserID = 'SELECT memberID FROM members WHERE username = $1'

    db.one(getUserID, [user]).then(row => {

        let user = row['memberID']
        db.noneOrMany(contactQuery, [user]).then(rows => {
            let members_a = rows['MemberID_A'];
            let members_b = rows['MemberID_B'];
            var contactIDs = [];
            

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
            usernames: contactInfos
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
        sender = rows[memberID]
        db.one(getUserName, [receiver]).then ( rows => {
            receiver = rows[memberID]

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
