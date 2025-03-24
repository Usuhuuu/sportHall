const express = require('express')
const router = express.Router();
const { User } = require('../model/dataModel')
const { authenticateJWT } = require('./Functions/auth')

router.get('/auth/profile_main', authenticateJWT, async (req, res) => {
    try {
        const userFind = await User.findOne({ _id: req.user.userID })
        if (!userFind) {
            return res.status(400).json({ message: "User doesnt exist " });
        }
        // let existingFriends = []
        // existingFriends = await User_Friend.findOne({ user_ID: req.user.userID });


        const formData = JSON.stringify({
            unique_user_ID: userFind.unique_user_ID,
            email: userFind.email,
            phoneNumber: userFind.phoneNumber,
            firstName: userFind.userNames.firstName,
            lastName: userFind.userNames.lastName,
        })
        res.json({ formData, role: userFind.userType, auth: true })
    }
    catch (err) {
        console.log(err)
    }
})

router.get('/auth/role', authenticateJWT, async (req, res) => {
    console.log("user Role")
    try {
        const userFind = await User.findOne({
            _id: req.user.userID,
            userType: req.user.userType
        });
        if (!userFind) {
            return res.json({ message: "User not found", auth: false });
        } else {
            console.log("user role is", userFind.userType)
            res.json({ role: userFind.userType })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post("/auth/updateProfile", authenticateJWT, async (req, res) => {
    console.log("update Profile")
    const { formData } = req.body;
    try {
        const userFind = await User.findOne({ _id: req.user.userID });
        if (!userFind) {
            return res.status(400).json({ message: "User doesnt exist " });
        }
        userFind.userNames.firstName = firstName;
        userFind.userNames.lastName = lastName;
        userFind.phoneNumber = phoneNumber;
        userFind.save();
        res.json({ message: "Profile Updated" })
    } catch (err) {
        console.log(err)
    }
})

module.exports = router;