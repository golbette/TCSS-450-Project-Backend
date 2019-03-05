const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

router.post('/searchcontacts', (req, res) => {
    let username = req.body['username'];
    db.one('select firstname, lastname, memberid from members where username = $1', [username]).then(row => {
        res.send({
            success:true,
            message:row
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

router.post('/connReq',  (req, res) => {
    let email = req.body['email_a'];
    let receiver = req.body['email_b'];
    db.one('select memberid from members where email = $1', [email]).then(row=>{
        let sender = row.memberid;

        db.one('select memberid from members where email = $1', [receiver]).then(row=>{
            let receiver = row.memberid;
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

module.exports = router;
