const express = require('express')
const router = express.Router();
const {sha3_256} = require('js-sha3')
const crypto = require('crypto')
const { User,UserNames, UserPassword } = require('../model/dataModel');
require('dotenv').config()
const speakeasy = require('speakeasy');
const redis = require('redis');
const hmacPromise = require('./Functions/HMAC')
const { v4: uuidv4 } = require('uuid');

router.post('/signup', async (req,res)=>{
    const {firstName, lastName, email, password, phoneNumber,userType, agree_terms, agree_privacy }= req.body
    try{
        const userFind = await User.findOne({email: email})
        if(userFind) {
            return res.status(401).json({message: "User Already Existing SDA"});
        }
        //16 byte Salt generate Hiin
        const saltGenerator = crypto.randomBytes(16).toString('hex'); 
        //password a HMAC hergelj ENCRYPT hiideg Functiong duudaj hergelj bn
        const hashedPassword = await hmacPromise(password, saltGenerator, 2000, 64, 'sha512');

        console.log("hashedPassword",hashedPassword )
        // UUID hergelj USERID generate hiin 
        const userIdGenerator = uuidv4()
        //
        const newUserDataStore = async() =>{
            const newUser = new User({
                user_ID: userIdGenerator,
                email: email,
                password :hashedPassword,
                phoneNumber: phoneNumber,
                userType: userType,
                //subDocument Saving
                userAgreeTerms:{
                    agree_terms: agree_terms,
                    agree_privacy: agree_privacy,
                }
            })
            await newUser.save()
            const newUserPassword = new UserPassword({
                user_ID: userIdGenerator,
                salt: saltGenerator,
                password: hashedPassword
            })
            await newUserPassword.save();
            const newUserNames = new UserNames({
                user_ID: userIdGenerator,
                firstName: firstName,
                lastName: lastName,
            })
            await newUserNames.save()
        }
        await newUserDataStore()
        res.status(202).json({ message: 'User created successfully!' });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})


const VALIDITY_PERIOD = 10 * 60;
const generateTOPT=()=> {
    return speakeasy.generateSecret({ length: 20 }).base32;
}
router.post("/phoneVerification", async (req,res)=> {
    const{phoneNumber} = req.body
    try{
        const secret = generateTOPT();
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        const expiresAt = Date.now() + VALIDITY_PERIOD * 1000;
        redisClient.setEx(token, expiresAt, secret,(err) => {
            if(err){
                return res.status(500).json({ success: false, message: 'Failed to store OTP' });
            }
            //verify code send! 
            return res.status(200).json({success:true,message: "Verification code has successfully sended"})
        })
    }catch(er) {
        return res.status(500).json({message: "Server has a error contact a servise center"})
    }
})

router.post('/checkVerify', async (req, res)=> {
    const { verify_Code } = req.body;
  // Retrieve the secret from Redis
    redisClient.get(verify_Code, (err, secret) => {
        if (err || !secret) {
            return res.status(400).json({ success: false, message: 'Verification code is invalid or expired' });
        }
        const isValid = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            verify_Code: verify_Code,
            window: 1 // Adjust the window to allow for clock drift
        });
        if (isValid) {
        // Delete the token from Redis after successful verification
        redisClient.del(verify_Code, (delErr) => {
            if (delErr) {
                res.status(500).json({message:"server Error"})
                return('Failed to delete OTP from Redis:', delErr);
            }
        });
        res.status(200).json({success:true, message:"Verify success"})
        } else {
        res.status(400).json({ success: false, message: 'TOTP is invalid' });
        }
    });
})


module.exports = router;