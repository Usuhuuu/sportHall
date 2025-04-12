const express = require('express');
const router = express.Router()
const { Group_Chat_Schema } = require('../model/dataModel')
const { authenticateJWT } = require('./Functions/auth')
require('dotenv').config()
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

router.get('/auth/chatcheck', authenticateJWT, async (req, res) => {
    try {
        const userID = req.user.userID;
        const user_unique_name = req.user.unique_user_ID
        console.log(user_unique_name)
        // daraan (user_unique_name ) heregleh ystoi 
        const chat = await Group_Chat_Schema.aggregate([
            { $match: { members: new ObjectId(userID) } },
            {
                $project: {
                    members: 1
                }
            }
        ]);
        console.log(chat)
        if (chat.length > 0) {
            return res.json({ message: "Group chat exists", chatGroupIDs: chat, success: true });
        } else {
            return res.json({ message: "Group chat not found", success: false });
        }
    } catch (err) {
        console.error("Error fetching chat history:", err);
        return res.status(500).json({ message: "Error fetching chat history" });
    }
});

router.post('/chat/groupJoin', authenticateJWT, async (req, res) => {
    try {
        const { groupId } = req.body;
        const decodedUserId = req.user.userID
        if (!groupId) {
            return res.json({ message: "chat doesn't exist", status: false })
        } else if (!decodedUserId) {
            return res.json({ message: "User Doesn't Exist", status: false })
        }
        console.log(decodedUserId)

        const group = await Group_Chat_Schema.findOne({ groupId });
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        // Check if the user is already a member of the group
        if (group.members.includes(decodedUserId)) {
            return res.status(400).json({ message: 'User is already a member of the group.' });
        }
        group.members.push(decodedUserId);
        await group.save();
        res.status(200).json({ message: 'User successfully added to the group.', group });
    } catch (err) {
        console.error('Error adding user to group:', err);
        res.status(500).json({ message: 'Error adding user to group.' });
    }
});

module.exports = router