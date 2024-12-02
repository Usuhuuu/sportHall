const express = require('express')
const router = express.Router();
const { User, User_Friend } = require('../model/dataModel')
const { authenticateJWT } = require('./Functions/auth')

router.get('/auth/profile_main', authenticateJWT, async (req, res) => {
    try {
        const userFind = await User.findOne({ _id: req.user.userID })
        if (!userFind) {
            return res.status(401).json({ message: "User doesnt exist " });
        }
        const existingFriends = await User_Friend.findOne({ user_ID: req.user.userID });

        if (!existingFriends) {
            return res.status(404).json({ message: "No friends data found." });
        }
        const formData = JSON.stringify({
            unique_user_ID: userFind.unique_user_ID,
            email: userFind.email,
            phoneNumber: userFind.phoneNumber,
            firstName: userFind.userNames.firstName,
            lastName: userFind.userNames.lastName,
            friends: existingFriends.friends,
            recieved_requests: existingFriends.recieved_requests.filter(req => req.status == "pending").map(req => req.friend_requests_recieved_from),
            //sentFriendIDs: existingFriends.send_requests.map(req => req.friend_requests_sended_to),
        })
        console.log("formData", formData)
        res.json({ formData, auth: true })

    }
    catch (err) {
        console.log(err)
    }
})

module.exports = router;