const express = require('express');
const router = express.Router();
const { User, UserPassword } = require('../../model/dataModel');
const crypto = require('crypto')
const jwt = require('jsonwebtoken');
const { secure_password_function, verify_password_promise } = require('../Functions/PBE')
require('dotenv').config();
const axios = require('axios')
const { refresh_auth_jwt } = require('../Functions/auth');
const { gmail } = require('googleapis/build/src/apis/gmail');
const argon2 = require('argon2');


router.post('/login', async (req, res) => {
    const { email, userPassword } = req.body;
    try {
        let userFind
        if (email.includes('@')) {
            userFind = await User.findOne({ email: email });
        } else {
            userFind = await User.findOne({ unique_user_ID: email });
        }
        if (!userFind) {
            return res.status(401).json({ message: "User does not exist" });
        }
        //Database Salt, password ogson passwordtai tulgah gej retrieve hiij awchirna
        const storedHash = userFind.userPassword;
        const isValid = await argon2.verify(storedHash, userPassword);
        if (isValid) {
            const accessToken = jwt.sign(
                {
                    userID: userFind._id,
                    unique_user_ID: userFind.unique_user_ID,
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
    try {
        if (refreshToken == null) {
            return res.status(401).json({ authAccess: false, message: 'User must Login again' });
        }
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
            if (err) return res.sendStatus(403);
            const userFind = await User.findOne({ _id: user.userID })
            const accessToken = jwt.sign({
                userID: user.userID,
                email: userFind.email
            },
                process.env.JWT_ACCESS_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                }
            );
            res.json({ authAccess: true, accessToken });

        });
    } catch (err) {
        res.status(500)
    }

});

module.exports = router;
