const express = require('express');
const router = express.Router();
const { User } = require('../../model/dataModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();
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
            return res.json({ message: "User does not exist", userNotFound: false, success: false });
        }
        //Database Salt, password ogson passwordtai tulgah gej retrieve hiij awchirna
        const storedHash = userFind.userPassword;
        const isValid = await argon2.verify(storedHash, userPassword);
        if (isValid) {
            const accessToken = jwt.sign(
                {
                    userID: userFind._id,
                    unique_user_ID: userFind.unique_user_ID,
                    userType: userFind.userType,
                },
                process.env.JWT_ACCESS_SECRET,
                {
                    algorithm: process.env.JWT_ALGORITHM,
                    expiresIn: process.env.JWT_EXPIRES_IN
                }
            );
            const refreshToken = jwt.sign(
                {
                    userID: userFind._id,
                },
                process.env.JWT_REFRESH_SECRET,
                {
                    algorithm: process.env.JWT_ALGORITHM,
                    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
                }
            );
            res.json({ success: true, accessToken, refreshToken });
        } else {
            return res.json({ auth: false, message: 'Wrong email or password', userNotFound: false });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ auth: false, message: 'Internal Server Error' });
    }
});

router.post("/auth/refresh", (req, res) => {
    const refreshToken = req.headers.authorization?.split(" ")[1];
    console.log("Refresh")
    try {
        if (refreshToken == null || undefined) {
            return res.status(400).json({ success: false, message: 'User must Login again' });
        }
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
            if (err) {
                console.log("pisda llr")
                return res.status(400).json({ success: false, message: "Invalid Refresh Token" });
            }

            const userFind = await User.findOne({ _id: user.userID })
            const accessToken = jwt.sign({
                userID: user.userID,
                unique_user_ID: userFind.unique_user_ID,
                userType: userFind.userType,
            },
                process.env.JWT_ACCESS_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                }
            );
            res.status(200).json({ success: true, newAccessToken: accessToken, refreshToken: refreshToken });
        });
    } catch (err) {
        res.status(500)
    }

});

module.exports = router;
