const express = require('express');
let db = require('../utilities/utils.js').db;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils.js').messaging;

router.post('/request',  (req, res) => {
    let sender = req.body['MemberID_A'];
    let receiver = req.body['MemberID_B'];
    let insert = 'INSERT INTO Contacts(MemberID_A, MemberID_B, accepted) VALUES ($1, $2, false)';

    db.none(insert, [sender, receiver]).then (() => {
        let select = 'SELECT * FROM Contacts WHERE MemberID_A = $1 AND MemberID_B = $2';
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
    }
})