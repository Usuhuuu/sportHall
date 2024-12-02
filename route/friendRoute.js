const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('./Functions/auth')
const { User, User_Friend } = require('../model/dataModel');
const { json } = require('body-parser');

router.get('/auth/friend', authenticateJWT, async (req, res) => {
    try {
        const decodedUserID = req.user.userID;
        const existingFriends = await User_Friend.findOne({ user_ID: decodedUserID });
        if (!existingFriends) {
            return res.status(404).json({ message: "No friends data found." });
        } console.log(existingFriends)
        const friends = JSON.stringify({
            friends: existingFriends.friends,
            recieved_requests: existingFriends.recieved_requests.filter(req => req.status == "pending").map(req => req.friend_requests_recieved_from),
            //sentFriendIDs: existingFriends.send_requests.map(req => req.friend_requests_sended_to),
        })
        console.log(friends)
        res.status(200).json({
            friends: friends
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An error occurred while fetching friends." });
    }
});

router.post('/auth/friend_request', authenticateJWT, async (req, res) => {
    const { friend_unique_ID } = req.body
    try {
        const decodedUserID = req.user.userID
        const isitExist = await User.findOne({ unique_user_ID: friend_unique_ID })
        if (isitExist) {
            // ene document bga uguig shalgaad bhgui bol shineer uusgej oruulan baival shuud oruulan
            let sender = await User_Friend.findOne({ user_ID: decodedUserID });

            if (!sender) {
                sender = new User_Friend({
                    user_ID: decodedUserID,
                    send_requests: [{
                        friend_requests_sended_to: friend_unique_ID
                    }]
                });
            } else {
                const AlreadySended = sender.send_requests.some(req => req.friend_requests_sended_to == friend_unique_ID)
                if (AlreadySended) {
                    return res.status(400).json({ message: "Request already sent" });
                }
                const isitFriend = sender.friends.includes(friend_unique_ID)
                if (isitFriend) {
                    return res.status(400).json({ message: "Already Friends" });
                }
                sender.send_requests.push({
                    friend_requests_sended_to: friend_unique_ID
                });
            }
            await sender.save();

            let receiver = await User_Friend.findOne({ user_ID: isitExist._id });
            if (!receiver) {
                receiver = new User_Friend({
                    user_ID: isitExist._id,
                    recieved_requests: [{
                        friend_requests_recieved_from: req.user.unique_user_ID,
                        status: 'pending'
                    }]
                });
            } else {
                const alreadyRecieved = receiver.recieved_requests.some(req => req.friend_requests_recieved_from == isitExist.unique_user_ID)
                if (alreadyRecieved) {
                    return res.status(400).json({ message: "Request already recieved" });
                }
                const isitFriend = receiver.friends.includes(isitExist.unique_user_ID)
                if (isitFriend) {
                    return res.status(400).json({ message: "Already Friends" });
                }
                receiver.recieved_requests.push({
                    friend_requests_recieved_from: isitExist.unique_user_ID,
                    status: 'pending'
                });
            }
            await receiver.save();
            if (receiver && sender) {
                res.status(200).json({ message: "Friend Request Sent" })
            } else {
                console.log(friendRequest)
                res.status(400).json({ message: "Friend Request not sent" })
            }
        } else {
            res.status(400).json({ message: "User not found" })
        }

    } catch (err) {
        console.log(err)
    }
})
router.post('/auth/friend_cancel', authenticateJWT, async (req, res) => {
    const { friend_unique_ID } = req.body;

    try {
        const decodedUserID = req.user.userID;

        // Find and update the specific friend request
        const updateResult = await User_Friend.findOneAndUpdate(
            {
                user_ID: decodedUserID,
                'send_requests.friend_requests_sended': friend_unique_ID
            },
            {
                $set: {
                    'send_requests.$.status': 'cancelled'
                }
            },
            { new: true } // Return the updated document
        );

        if (updateResult) {
            // Check if the request status was successfully updated to "cancelled"
            const isCancelled = updateResult.send_requests.some(
                request =>
                    request.friend_requests_sended === friend_unique_ID &&
                    request.status === 'cancelled'
            );

            if (isCancelled) {
                return res.status(200).json({ message: "Friend Request Cancelled" });
            }
        }

        res.status(400).json({ message: "Friend Request not cancelled or does not exist" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An error occurred while cancelling the friend request." });
    }
});

router.post('/auth/friend_remove', authenticateJWT, async (req, res) => {
    const { friend_unique_ID } = req.body
    try {
        const decodedUserID = req.user.userID
        const updateResult = await User_Friend.findOneAndUpdate(
            { user_ID: decodedUserID, friends: friend_unique_ID },
            { $pull: { friends: friend_unique_ID } },
            { new: true } // Return the updated document
        );
        if (isitFriend) {
            res.status(200).json({ message: "Friend removed" })
        } else {
            res.status(400).json({ message: "Friend not removed" })

        }

    } catch (err) {
        console.log(err)
    }
})
router.post('/auth/friend_accept', authenticateJWT, async (req, res) => {
    const { friend_unique_ID } = req.body;
    console.log(friend_unique_ID)
    try {
        const decodedUserID = req.user.userID;
        const receiver = await User_Friend.findOne({
            user_ID: decodedUserID,
            recieved_requests: {
                $elemMatch: {
                    friend_requests_recieved_from: friend_unique_ID,
                    status: 'pending'
                }
            }
        });
        console.log(receiver)
        if (!receiver) {
            return res.status(404).json({ message: "User data not found." });
        } else {
            try {
                // Check if the friend request exists in received_requests
                const requestIndex = receiver.recieved_requests.findIndex(
                    req => req.friend_requests_recieved_from === friend_unique_ID && req.status === 'pending'
                );
                console.log(requestIndex);

                if (requestIndex === -1) {
                    return res.status(400).json({ message: "Friend request not found." });
                }
                receiver.recieved_requests[requestIndex].status = 'accepted';
                receiver.friends = receiver.friends || [];

                if (!receiver.friends.includes(friend_unique_ID)) {
                    receiver.friends.push(friend_unique_ID);
                }

            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "An error occurred while processing the request." });
            }
        }

        await receiver.save();

        // Update the other user's data
        const isitExist = await User.findOne({ unique_user_ID: friend_unique_ID })
        console.log(isitExist)
        if (!isitExist) {
            return res.status(404).json({ message: "User data not found for the other user." });
        } else {
            const check = await User_Friend.findOneAndUpdate(
                { user_ID: isitExist._id },
                {
                    $push: {
                        friends: req.user.unique_user_ID
                    },
                    $pull: {
                        send_requests: {
                            friend_requests_sended_to: req.user.unique_user_ID
                        }
                    }
                },
                { new: true } // Ensures the updated document is returned
            );


        }


        // Success response
        res.status(200).json({ message: "Friend request accepted and friend added successfully." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An error occurred while accepting the friend request." });
    }
});
module.exports = router;