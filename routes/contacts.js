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

    db.one(select, [sender, receiver]).then(() =>{
        res.send({
            success:false,
            error: "Request already exists!"
            
        })
        return;
    })

    db.none(insert, [sender, receiver]).then (() => {
        db.one(select, [sender, receiver]).then(() => {
            res.send({
                success:true
            })
        }).catch(err => {
            res.send({
                success:false,
                error:err
            })
        })
    })
})

router.post('/approve', (req, res) => {
    let sender = req.body['MemberID_A'];
    let receiver = req.body['MemberID_B'];

    let select = 'SELECT verified FROM CONTACTS where MemberID_B = $1 AND MemberID_A = $2';

    db.one(select, [receiver, sender]).then(rows =>{
        let update = 'UPDATE CONTACTS where MemberID_B = $1 AND MemberID_A = $2 SET verified = 1';

        db.none(update, [receiver, sender]).then( () => {

        })
    })
})

module.exports = router;
