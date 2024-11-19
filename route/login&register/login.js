const express = require('express');
const router = express.Router();
const { User,UserPassword } = require('../../model/dataModel');
const crypto = require('crypto')
const jwt = require('jsonwebtoken');
const {hmacPromise} = require('../Functions/HMAC')
require('dotenv').config();
const axios = require('axios')
const {refresh_auth_jwt} = require('../Functions/auth');
const { gmail } = require('googleapis/build/src/apis/gmail');


router.post('/login', async (req, res) => {
    const {password, email } = req.body;
    console.log(`Received login request: email=${email}`);
    try {
        const userFind = await User.findOne({ email: email });
        if (!userFind) {
            return res.status(401).json({ message: "User does not exist" });
        }
        //Database Salt, password ogson passwordtai tulgah gej retrieve hiij awchirna
        const storedSalt = userFind.userPassword.salt;
        const storedHash = userFind.userPassword.password;
        
        const hashedPassword = await hmacPromise(password, storedSalt, 2000, 64, 'sha512');
        console.log(hashedPassword)
        if (hashedPassword === storedHash) {  
            const accessToken = jwt.sign(
                {
                    userID: userFind._id,  
                    email: userFind.email, 
                },
                process.env.JWT_ACCESS_SECRET,
                {
                    algorithm: 'HS256',
                    expiresIn: process.env.JWT_EXPIRES_IN
                }
            );
            const refreshToken = jwt.sign(
                {
                    userID: userFind._id, 
                },
                process.env.JWT_REFRESH_SECRET,
                {
                    algorithm: 'HS256',
                    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
                }
            );
            res.status(200).json({ auth: true, accessToken, refreshToken });
        } else {
            return res.status(401).json({ auth: false, message: 'Wrong email or password' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ auth: false, message: 'Internal Server Error' });
    }
});

router.post("/refresh", (req, res) => {
    const refreshToken = req.headers.refresh;
    try{
    if (refreshToken == null) {
        return res.status(401).json({authAccess: false, message: 'User must Login again'});
    }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET,async (err, user) => {
        if (err) return res.sendStatus(403);
        const userFind = await User.findOne({_id:user.userID})
        const accessToken = jwt.sign({ 
            userID: user.userID,
            email:userFind.email 
        }, 
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );
        res.json({ authAccess:true, accessToken });

    });
    }catch(err){
        res.status(500)
    }
    
});

module.exports = router;
