const { Server } = require('socket.io');
const { Group_Chat_Schema, } = require('../../model/dataModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const setupWebSocket = (server) => {
    const io = new Server(server, { cors: { origin: "*" } });

    io.use((socket, next) => {
        const { token } = socket.handshake.auth;
        const { groupId } = socket.handshake.query;
        if (!token) {
            return next(new Error("No Token provided"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            if (!decoded?.userID) {
                return next(new Error("Invalid Token"));
            }
            socket.userId = decoded.userId;
            socket.groupId = groupId;
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", async (socket) => {
        console.log(`User ${socket.userId} connected to group ${socket.groupId}`);

        socket.on("chatHistory", async ({ timer } = {}) => {
            try {

                const timeStampConvert = timer ? new Date(timer) : new Date();
                console.log("Time Stamp Convert: ", timeStampConvert);


                const group = await Group_Chat_Schema.aggregate([
                    { $match: { _id: new ObjectId(socket.groupId) } },
                    { $unwind: "$messages" },
                    { $match: { "messages.timestamp": { $lt: timeStampConvert } } },
                    { $sort: { "messages.timestamp": -1 } },
                    { $limit: 20 },
                    { $group: { _id: "$_id", messages: { $push: "$messages" } } },
                ])

                if (!group || (Array.isArray(group) && group.length === 0)) {
                    console.log("No messages found");
                    return socket.emit("chatHistory", { messages: [], nextCursor: null });
                }
                const messages = group[0].messages;
                const nextCursor = messages.length > 0 ? messages[messages.length - 1].timestamp : null;

                socket.emit("chatHistory", {
                    messages: messages,
                    nextCursor: nextCursor
                });

            } catch (err) {
                console.error("Error fetching chat history:", err);
            }
        });

        socket.on("joinGroup", async () => {
            try {
                const group = await Group_Chat_Schema.findById(socket.groupId);
                if (!group) return socket.emit("errorMessage", { error: "Group not found" });

                if (!group.members.includes(socket.userId)) {
                    return socket.emit("errorMessage", { error: "You are not allowed to join this group." });
                }

                socket.join(socket.groupId);
                socket.emit("joinGroupResponse", { success: `User ${socket.userId} joined group ${socket.groupId}` });

                const messages = group.messages.sort((a, b) => a.timestamp - b.timestamp);
                socket.emit("chatHistory", messages);
            } catch (err) {
                console.error("Error joining group:", err);
            }
        });

        socket.on("sendMessage", async (data) => {
            if (!data || typeof data !== "object") {
                return socket.emit("errorMessage", { error: "Invalid data format" });
            }

            const { message } = data;
            if (!socket.groupId) return socket.emit("errorMessage", { error: "Group ID is required" });

            if (!message || message.length > 2000) {
                return socket.emit("errorMessage", { error: "Message is too long. Limit to 2000 characters." });
            }

            try {
                await Group_Chat_Schema.findByIdAndUpdate(
                    socket.groupId,
                    {
                        $push: {
                            messages: {
                                sender_unique_name: data.sender_unique_name,
                                senderId: socket.userId,
                                message: message,
                                timestamp: data.timestamp
                            },
                        },
                    },
                    { new: true, upsert: true }
                );

                io.to(socket.groupId).emit("receiveMessage", {
                    socketId: socket.groupId,
                    messages: {
                        sender_unique_name: data.sender_unique_name,
                        senderId: socket.userId,
                        message: message,
                        timestamp: data.timestamp
                    }
                });

                console.log(`Message from ${socket.userId} in group ${socket.groupId}: ${message}`);
            } catch (err) {
                console.error("Error saving message:", err);
                socket.emit("errorMessage", { error: "Error sending message. Try again later." });
            }
        });

        socket.on("reconnect", async () => {
            try {
                const group = await Group_Chat_Schema.findById(socket.groupId);
                if (!group) {
                    return socket.emit("errorMessage", { error: "Group not found" });
                }

                if (!group.members.includes(socket.userId)) {
                    return socket.emit("errorMessage", { error: "You are not a member of this group." });
                }

                socket.join(socket.groupId);
                const messages = group.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                socket.emit("chatHistory", messages);
                console.log(`User ${socket.userId} rejoined group ${socket.groupId}`);
            } catch (err) {
                console.error("Error during reconnection:", err);
            }
        });

        socket.on("disconnect", (reason) => {
            console.log(`User ${socket.userId} disconnected from group ${socket.groupId}. Reason: ${reason}`);

            if (reason !== "io server disconnect") {
                socket.emit("disconnect_reason", { reason });
            }
        });
    });

    io.on("connect_error", (err) => {
        console.log("Connection error:", err.message);
        if (err.message === "jwt expired" || err.message === "Invalid token") {
            io.emit("connect_error_reason", { error: err.message });
        }
    });
};


module.exports = setupWebSocket;