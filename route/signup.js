const express = require('express')
const router = express.Router();
const {sha3_256} = require('js-sha3')
const bcrypt = require('bcrypt');
const crypto = require('crypto')
const { User,UserAgreements, UserNames } = require('../model/dataModel');
require('dotenv').config()
const speakeasy = require('speakeasy');
const redis = require('redis');


router.post('/signup', async (req,res)=>{
    const {userName_ID,firstName, lastName, email, password, phoneNumber, agree_terms, agree_privacy }= req.body
    try{
        const userFind = await User.findOne({email: email})
        if(userFind) {
            return res.status(401).json({message: "User Already Existing SDA"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash((password, salt))
        const newUser = new User({
            userName_ID: userName_ID,
            email: email,
            password :hashedPassword,
            phoneNumber: phoneNumber,
        })
        const newUserNames = new UserNames({
            userName_ID: userName_ID,
            firstName: firstName,
            lastName: lastName,
        })
        const newUserAgreeTerms = new UserAgreements({
            userName_ID: userName_ID,
            agree_terms: true,
            agree_privacy: true,
        })
        await newUser, newUserAgreeTerms;
        res.status(202).json({ message: 'User created successfully!' });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.post("/idcheck",async (req,res) => {
    const {userName_ID} = req.body
    try{
        const isUserNameExist = await User.findOne({userName_ID: userName_ID})
        if(isUserNameExist){
            return res.status(404).json({message:"This user name already exist"})
        } else{
            return res.status(200).json({message:"This UserName is possible to use"})
        }
    } catch(er){
        return res.status(500).json({message: "Server has a error contact a servise center"})
    }
})





const TOTP_VALIDITY_PERIOD = 10 * 60;
const redisClient = redis.createClient({
    url: process.env.REDIS_URL // Ensure this URL is correctly set in your environment variables
});
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
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
        const expiresAt = Date.now() + TOTP_VALIDITY_PERIOD * 1000;
        redisClient.setex(token, TOTP_VALIDITY_PERIOD, secret,(err) => {
            if(err){
                return res.status(500).json({ success: false, message: 'Failed to store OTP' });
            }
            return res.status(200).json({success:true,message: "Verification code has successfully sended"})
        })
    }catch(er) {
        return res.status(500).json({message: "Server has a error contact a servise center"})
    }
})
router.post('/checkVerify', async (req, res)=> {
    const { token } = req.body;
  // Retrieve the secret from Redis
  redisClient.get(token, (err, secret) => {
    if (err || !secret) {
      return res.status(400).json({ success: false, message: 'TOTP is invalid or expired' });
    }
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Adjust the window to allow for clock drift
    });

    if (isValid) {
      // Delete the token from Redis after successful verification
      redisClient.del(token, (delErr) => {
        if (delErr) {
          console.error('Failed to delete OTP from Redis:', delErr);
        }
      });
      res.status(200).json({success:true, message:"Verify success"})
    } else {
      res.status(400).json({ success: false, message: 'TOTP is invalid' });
    }
  });
})


module.exports = router;