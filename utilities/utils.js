//Get the connection to Heroku Database
let db = require('./sql_conn.js');
let messaging = require('./pushy_services.js');

//We use this create the SHA256 hash
const crypto = require("crypto");

async function sendEmail(from, receiver, subj, message) {
  //research nodemailer for sending email from node.
  // https://nodemailer.com/about/
  // https://www.w3schools.com/nodejs/nodejs_email.asp
  //create a burner gmail account 
  //make sure you add the password to the environmental variables
  //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

  //fake sending an email for now. Post a message to logs. 
  console.log('Email sent: ' + message);

  const nodemailer = require('nodemailer');

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'blatherer.chat@gmail.com',
            // Might want to add that password into the .env file 
            // if we plan on using this account as the account
            // that sends all the email verification links
            pass: 'fuHcyc-vujfu0-rogdif'
        }
    });

    let mailOptions = {
        from: 'blatherer.chat@gmail.com',
        to: receiver,
        subject: subj,
        html: message
    };

  return await transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
        console.log('Email sent: ' + info.response);
        }
    }); 
}

/**
 * Method to get a salted hash.
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex");
}

async function sendRegistrationEmail(from, receiver, subj, message) {
let finalMessage = (`<html> 
<head>
<style>
body {background-color: black;}
h1   {color: #310a31;}
p    {color: #847996;}
</style></head>
<body> 
                <div> 
                <h1>Welcome to Blatherer!</h1>
                <p>To get started chatting click the link to verify your account.</p>
                <p> ${message}</p>
                </div> 
                </body>  
                </html>`);

      return await sendEmail(from, receiver, subj, finalMessage);
}



module.exports = { 
    db, getHash, sendEmail, messaging, sendRegistrationEmail
};
