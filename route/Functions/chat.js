const { Server } = require('socket.io');
const {Group_Chat_Schema} = require('../../model/dataModel')

const setupWebSocket= (server) => {
    const io = new Server(server)
    io.on("connection", (socket) => {
        socket.emit("User Connected ", socket.id)
        socket.on('joinGroup',async ({ groupId, userId }) => {
            // member uguig shalgan
            const isMember = await Group_Chat_Schema.findOne(groupId);
            if (!isMember || !isMember.members.includes(userId)) {
                socket.emit('errorMessage', { error: 'You are not allowed to join this group.' });
                return;
            }
            socket.join(groupId);
            socket.emit(`User ${userId} joined group: ${groupId}`);;
            // Load chat history from MongoDB and send to the user
            const messages = isMember.messages.sort((a, b) => a.timestamp - b.timestamp);
            socket.emit('chatHistory', messages);

            const MAX_MESSAGE_LENGTH = 2000;
            socket.on('sendMessage', async (data) => {
                const { groupId, senderId, message } = data;
                if (message.length > MAX_MESSAGE_LENGTH) {
                    socket.emit('errorMessage', { error: 'Message is too long. Please limit to 2000 characters.' });
                }
                // chat heseg deer frontEndees Error ogno herev 2000 gaas ih baival
                try {
                    // Save the message to the database
                    const chat =await Group_Chat_Schema.findOneAndUpdate(
                        { groupId },
                        {
                            $push: { messages: { senderId, message, timestamp: new Date() } }
                        },
                        { new: true, upsert: true }
                    );
                    // Broadcast the new message to all clients in the group
                    io.to(groupId).emit('receiveMessage', { senderId, message });
                } catch (err) {
                    console.error("Error saving message:", err);
                }
            });
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    
    })
}


module.exports = setupWebSocket;