const express = require('express')
const router = express.Router();
const { sha3_256 } = require('js-sha3')
const crypto = require('crypto')
const { User, UserNames, UserPassword } = require('../../model/dataModel');
require('dotenv').config()
const speakeasy = require('speakeasy');
const { secure_password_function } = require('../Functions/PBE')
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../../config/redisConnect');
const { emailQueue, deletedJobIds } = require('../Functions/mailQueue')

router.post('/signup', async (req, res) => {
    const { unique_user_ID, email, phoneNumber, userPassword, userNames, userAgreeTerms, userType } = req.body
    try {
        const userFind = await User.findOne({ email: email })
        if (userFind) {
            return res.status(400).json({ message: "User Already Existing SDA" });
        }
        //16 byte Salt generate Hiin
        // CSPRNG ashiglaj salt uusgeh
        const saltGenerator = crypto.randomBytes(16).toString('hex');
        console.log("salt", saltGenerator)
        const password = userPassword;
        //password a PBE hergelj ENCRYPT hiideg Functiong duudaj hergelj bn
        const hashedPassword = await secure_password_function(password, saltGenerator);
        console.log("hashedpass", hashedPassword)
        await User.create({
            unique_user_ID: unique_user_ID,
            email: email,
            phoneNumber: phoneNumber,
            //subDocument Saving
            userAgreeTerms: {
                agree_terms: userAgreeTerms.agree_terms,
                agree_privacy: userAgreeTerms.agree_privacy,
            },
            userPassword: hashedPassword,
            userNames: {
                firstName: userNames.firstName,
                lastName: userNames.lastName
            },
            userType: userType

        })
        res.status(200).json({ message: 'User created successfully!' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})

const VALIDITY_PERIOD = 600;
router.post("/phoneVerification", async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const secret = speakeasy.generateSecret({ length: 20 }).base32; // Generate a base32 secret
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        const client = await redisClient();
        // Token Redis dotor turuulj hadgalj baij hodoln daraachin shatluu
        try {
            await client.setEx(token, VALIDITY_PERIOD, secret);
        } catch (err) {
            console.error('Error saving token to Redis:', err);
            return res.status(500).json({ message: "Failed to save verification token. Please try again later." });
        }

        // Queue mail yvuulan 
        try {
            await emailQueue.add('sendVerificationEmail', {
                fromMail: process.env.GMAIL_USER,
                toMail: phoneNumber,
                subject: "Verification Code",
                text: `Your verification code is ${token}`
            });
            res.status(200).json({ success: true, message: "Verification code sent successfully" });
        } catch (err) {
            console.error('Error adding job to email queue:', err);
            res.status(400).json({ success: false, message: "Failed to queue email." });
        }

        // Optionally, clean up old jobs
        await deletedJobIds();
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ message: "Server error. Please contact support.", error: err.message });
    }
});


router.post('/checkVerify', async (req, res) => {
    const { verify_Code } = req.body;
    if (!verify_Code) {
        return res.status(400).json({ success: false, message: 'Verification code is required' });
    }
    try {
        const client = await redisClient();
        const secret = await client.get(verify_Code);
        if (!secret) {
            console.log(`Verification code ${verify_Code} not found or expired`);
            return res.status(400).json({ success: false, message: 'Verification code not found or expired' });
        }
        console.log(`Secret retrieved for code ${verify_Code}: ${secret}`);
        // Verify the token using speakeasy
        const isValid = speakeasy.totp.verify({
            secret: secret.base32,
            encoding: 'base32',
            token: verify_Code,
            window: 100  // Allow slight time drift
        });
        if (isValid) {
            await deletedJobIds()
            await client.del(verify_Code);
            console.log(`Verification successful and code ${verify_Code} deleted from Redis`);
            return res.status(200).json({ success: true, message: 'Verification successful' });
        } else {
            console.log(`Verification failed for code ${verify_Code}`);
            return res.status(401).json({ success: false, message: 'Invalid verification code' });
        }
    } catch (err) {
        console.error('Error during verification:', err);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});


router.post('/checkunique', async (req, res) => {
    const { unique_user_ID } = req.body
    try {
        if (!unique_user_ID) {
            return res.status(400).json({ message: "User ID is required" })
        }
        const UserFind = await User.findOne({ unique_user_ID: unique_user_ID })
        if (UserFind) {
            res.json({ message: "User ID already existing", user_id_available: false })
        } else {
            console.log("User ID is available")
            res.json({ message: "User ID is available", user_id_available: true })
        }

    } catch (err) {
        console.error(err)
    }

})


module.exports = router;