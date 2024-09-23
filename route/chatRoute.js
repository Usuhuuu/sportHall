const express = require('express');
const router = express.Router()
const {Group_Chat_Schema} = require('../model/dataModel')

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
        const newGroup = new Group_Chat_Schema({groupId: new mongoose.Types.ObjectId()})
        await newGroup.save()
        res.status(201).json(newGroup)
    }catch (err) {
        res.status(500).json({ message: "Error creating group" });
    }
})

module.exports = router