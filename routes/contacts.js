const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

router.post('/request',  (req, res) => {
    let sender = req.body['MemberID_A'];
    let receiver = req.body['MemberID_B'];
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

router.post('/approve', (req, res) => {
    let sender = req.body['MemberID_A'];
    let receiver = req.body['MemberID_B'];

    let select = 'SELECT verified FROM CONTACTS WHERE MemberID_B = $1 AND MemberID_A = $2';

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
})

module.exports = router;
