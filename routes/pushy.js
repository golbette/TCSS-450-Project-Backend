const express = require('express');
let db = require('../utilities/util.js').db;
let getHash = require('../utilities/util.js').getHash;
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.post('/token', (req, res) => {
    let email = req.body['email'];
    let token = req.body['token'];

    if (email && token) {
        db.one('SELECT MemberID FROM Members WHERE Email=$1', [email]).then(row => {
            let id = row['memberid'];
            let params = [id, token];
            db.manyOrNone('INSERT INTO Push_Token (MemberID, Token) VALUES ($1, $2) ON CONFLICT (MemberID) DO UPDATE SET Token=$2;', params).then(row => {
                res.send({
                    success:true,
                    message:"Token Saved"
                })
            }).catch(err => {
                console.log("Failed on insert pushy token: " + err);
                res.send({
                    success:false, 
                    message:err
                })
            })
        }).catch(err => {
            console.log("Error on select");
            res.send({
                success:false,
                message:err
            })
        })
    } else {
        res.send({
            success:false,
            message:"Missing email or token"
        })
    }
})

module.exports = router;