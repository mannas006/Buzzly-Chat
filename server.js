const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

const animeNames = ['Naruto', 'Goku', 'Luffy', 'Saitama', 'Ichigo', 'Light', 'Eren', 'Sakura', 'Mikasa', 'Vegeta'];
let connectedClients = [];
let currentChat = {}; // Keeps track of the current chat partners
let waitingQueue = []; // Queue to manage waiting users

// Function to get a random anime name
function getRandomName() {
    return animeNames[Math.floor(Math.random() * animeNames.length)];
}

// Handle new connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign a random name to the socket
    const randomName = getRandomName();
    socket.name = randomName;

    // Add the socket to the waiting queue
    waitingQueue.push(socket);

    // Notify the user of their assigned name
    socket.emit('connected', { yourName: randomName });

    // Attempt to connect the new user with another user from the queue
    if (waitingQueue.length >= 2) {
        const user1 = waitingQueue.shift(); // Get the first user from the queue
        const user2 = waitingQueue.shift(); // Get the second user from the queue

        // Notify both users of their chat partners
        user1.emit('connected', { yourName: user1.name, partnerName: user2.name });
        user2.emit('connected', { yourName: user2.name, partnerName: user1.name });
        
        // Update currentChat to keep track of connected users
        currentChat[user1.id] = user2.id;
        currentChat[user2.id] = user1.id;
    } else {
        socket.emit('waiting');
    }

    socket.on('sendMessage', (message) => {
        // Only send messages to the partner client
        const partnerId = currentChat[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('receiveMessage', { sender: socket.name, content: message });
        }
    });

    socket.on('skip', () => {
        // Notify the other client that the current user has skipped
        const partnerId = currentChat[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('waiting');
            delete currentChat[partnerId];
        }
        // Clear the current chat info
        delete currentChat[socket.id];
        // Add back to the waiting queue
        waitingQueue.push(socket);
        socket.emit('waiting');
        
        // Try to connect the new user with another user from the waiting queue
        if (waitingQueue.length >= 2) {
            const user1 = waitingQueue.shift(); // Get the first user from the queue
            const user2 = waitingQueue.shift(); // Get the second user from the queue

            // Notify both users of their chat partners
            user1.emit('connected', { yourName: user1.name, partnerName: user2.name });
            user2.emit('connected', { yourName: user2.name, partnerName: user1.name });
            
            // Update currentChat to keep track of connected users
            currentChat[user1.id] = user2.id;
            currentChat[user2.id] = user1.id;
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove the client from the waiting queue
        waitingQueue = waitingQueue.filter(client => client.id !== socket.id);

        // Notify the partner client that the current user has disconnected
        const partnerId = currentChat[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('waiting');
            delete currentChat[partnerId];
        }
        delete currentChat[socket.id];
    });

    // Heartbeat mechanism
    socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack');
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
