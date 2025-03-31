const express = require('express');
const { authenticateJWT } = require('../Functions/auth');
const { default: Expo } = require('expo-server-sdk');
const router = express.Router();


router.post('/auth/send-notification', authenticateJWT, async (req, res) => {
    const { tokens, messageTitle, messageBody } = req.body;
    if (!tokens || !title || !sub_title || !body) {
        return res.status(400).json({ message: "Missing field" })
    }
    let message = []
    for (let token of tokens) {
        if (!Expo.isExpoPushToken(token)) {
            console.error(`Invalid Expo push token: ${token}`);
            continue;
        }
        message.push({
            to: token,
            sound: 'default',
            title: messageTitle,
            body: messageBody,
            data: { someData: 'goes here' },
        })
    }

    let expo = new Expo();
    const chunks = expo.chunkPushNotifications(message);
    let tickets = [];

    try {
        for (let chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        console.log("Tickets:", tickets);
        res.status(200).json({ message: "Notifications sent successfully!" });
    } catch (error) {
        console.error("Error sending notifications:", error);
        res.status(500).json({ message: "Failed to send notifications" });
    }


})


module.exports = router