const { Server } = require('socket.io');
const { Group_Chat_Schema } = require('../../model/dataModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const setupWebSocket = (server) => {
    const io = new Server(server);
    io.on("connect", async (socket) => {
        const { token } = socket.handshake.auth;
        const { groupId } = socket.handshake.query
        if (!token) {
            console.log("No token provided, closing connection.");
            socket.disconnect(); // Disconnect if no token is provided
            return;
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
            if (!decoded || !decoded.userID) {
                console.log("Invalid token, user ID missing.")
                socket.disconnect()
            }
            socket.userID = decoded.userID
            const group = await Group_Chat_Schema.findById({ _id: groupId });

            socket.on("chatHistory", async () => {
                try {
                    const group = await Group_Chat_Schema.findById({ _id: groupId });
                    if (!group) return socket.emit("errorMessage", { error: "Group not found" });
                    const sortedMessages = group.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    socket.emit("chatHistory", sortedMessages);
                } catch (err) {
                    console.log(err)
                }
            })
            socket.on('reconnected', async () => {
                try {
                    if (!group) return socket.emit("errorMessage", { error: "Group not found" });
                    if (!group.members.includes(socket.userID)) return socket.emit("errorMessage", { error: "You are not a member of this group." });
                    const messages = group.messages.sort((a, b) => a.timestamp - b.timestamp);
                    socket.emit("chatHistory", messages);
                    socket.join(groupId);
                    console.log(`User ${socket.userID} rejoined group ${groupId}`);
                } catch (err) {
                    console.log(err)
                }
            })
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
                // Optionally, you could leave the group when the user disconnects
                socket.rooms.forEach((room) => {
                    socket.leave(room);
                    console.log(`User left group ${room}`);
                });
            });


            socket.on('joinGroup', async ({ groupId }) => {
                try {
                    if (!group) return socket.emit("errorMessage", { error: "Group not found" });
                    if (!group.members.includes(socket.userID)) return socket.emit("errorMessage", { error: "You are not allowed to join this group.", });
                    socket.join(groupId);
                    socket.emit("joinGroupResponse", {
                        success: `User ${socket.userID} joined group ${groupId}`,
                    });
                    const messages = group.messages.sort((a, b) => a.timestamp - b.timestamp);
                    socket.emit("chatHistory", messages);

                } catch (err) {
                    console.log(err)
                }
            })

            socket.on('sendMessage', async (data) => {
                if (!data || typeof data !== "object") return socket.emit("errorMessage", { error: "Invalid data format" });
                const { groupId, message, timestamp } = data
                if (!groupId) return socket.emit("errorMessage", { error: "Group ID is required" });
                const MAX_MESSAGE_LENGTH = 2000;
                if (!message || message.length > MAX_MESSAGE_LENGTH) return socket.emit("errorMessage", { error: "Message is too long. Please limit to 2000 characters." })
                try {
                    await Group_Chat_Schema.findByIdAndUpdate(
                        { _id: groupId },
                        {
                            $push: {
                                messages: {
                                    senderId: socket.userID,
                                    message: data.message,
                                    timestamp: data.timestamp || new Date(),
                                }
                            }
                        },
                        { new: true, upsert: true }
                    )
                    //send msj to all members
                    io.to(groupId).emit("receiveMessage", {
                        senderId: socket.userID,
                        message: data.message
                    })
                    console.log(`Message from ${socket.userID} in group ${groupId}: ${message}`);

                } catch (err) {
                    console.error("Error saving message:", err);
                    socket.emit("errorMessage", { error: "Error sending message. Please try again later.", })
                }
            });

            socket.on('errorMessage', (data) => {
                console.error(data.error);
            });



        } catch (err) {
            socket.emit('errorMessage', { error: 'Invalid or expired token' });
            socket.disconnect();
            return;
        }

    });
};

module.exports = setupWebSocket;