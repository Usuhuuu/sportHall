const express = require('express');
const router = express.Router();
const { User,UserPassword } = require('../model/dataModel');
const crypto = require('crypto')
const jwt = require('jsonwebtoken');
const hmacPromise = require('./Functions/HMAC')
require('dotenv').config();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Received login request: email=${email}`);
    try {
        const userFind = await User.findOne({ email: email });
        const userID = userFind.userName_ID;
        if (!userFind) {
            return res.status(401).json({ message: "User does not exist" });
        }
        //Database Salt, password ogson passwordtai tulgah gej retrieve hiij awchirna
        const user_Password_Data_Retrieve = await UserPassword.findOne({user_ID: userID})
        const storedSalt = user_Password_Data_Retrieve.salt;
        const storedHash = user_Password_Data_Retrieve.password;
        const hashedPassword = await hmacPromise(password, storedSalt, 2000, 64, 'sha512');
        if (hashedPassword === storedHash) {  
            const accessToken = jwt.sign(
                {
                    userID: userFind._id,  
                    email: userFind.email, 
                },
                process.env.JWT_ACCESS_SECRET,
                {
                    algorithm: 'HS256',
                    expiresIn: '1h',
                }
            );
            const refreshToken = jwt.sign(
                {
                    userID: userFind._id, 
                },
                process.env.JWT_REFRESH_SECRET,
                {
                    algorithm: 'HS256',
                    expiresIn: '1h',
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
    const refreshToken = req.headers["refresh"];
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign(
            { userID: user.userID }, // Make sure to use user.userID
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: "1h",
            }
        );
        res.status(200).json({ accessToken });
    });
});

module.exports = router;
