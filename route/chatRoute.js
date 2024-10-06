const express = require('express');
const router = express.Router()
const {Group_Chat_Schema} = require('../model/dataModel')
const setupWebsocket = require('./Functions/chat')

router.get('/api/chat/:groupId', async (req, res)=> {
    const {groupId} = req.params;
    try{
        const chat = await Group_Chat_Schema.findOne({ groupId });
        if(chat){
            res.status(201).json(chat.messages)
        }else {
            res.status(404).json({ message: "Group chat not found" });
        }

    }catch (err) {
        res.status(500).json({ message: "Error fetching chat history" });
    }
})

router.post('/api/group', async (req, res) => {
    try{
        const {user_id} = req.body;
        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required.' });
        }
        const newGroup = new Group_Chat_Schema({
            members: [user_id],
            messages: [],
        } )
        await newGroup.save()
        res.status(201).json(newGroup)
    }catch (err) {
        res.status(500).json({ message: "Error creating group" });
    }
})

router.post('/api/group/:groupId/join', async (req, res) => {
    try {
        const { user_id } = req.body; 
        const { groupId } = req.params;
        if (!user_id || !groupId) {
            return res.status(400).json({ message: 'User ID and Group ID are required.' });
        }
        const group = await Group_Chat_Schema.findOne({ groupId });
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        // Check if the user is already a member of the group
        if (group.members.includes(user_id)) {
            return res.status(400).json({ message: 'User is already a member of the group.' });
        }
        group.members.push(user_id);
        await group.save();
        res.status(200).json({ message: 'User successfully added to the group.', group });
    } catch (err) {
        console.error('Error adding user to group:', err);
        res.status(500).json({ message: 'Error adding user to group.' });
    }
});

module.exports = router