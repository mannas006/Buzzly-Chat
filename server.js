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

    // Notify the user of their assigned name
    socket.emit('connected', { yourName: randomName });

    // Add the socket to the list of connected clients
    connectedClients.push(socket);

    // Check if there is another user to connect
    if (connectedClients.length > 1) {
        connectUsers();
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
            // Remove the partner from the connected list
            connectedClients = connectedClients.filter(client => client.id !== partnerId);
            delete currentChat[partnerId];
        }
        // Clear the current chat info for the skipping user
        delete currentChat[socket.id];
        socket.emit('waiting');

        // Try to connect the skipped user with a new partner
        if (connectedClients.length > 1) {
            connectUsers();
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove the client from the list
        connectedClients = connectedClients.filter(client => client.id !== socket.id);

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

// Function to connect two users
function connectUsers() {
    if (connectedClients.length > 1) {
        const user1 = connectedClients[0];
        const user2 = connectedClients[1];

        // Connect user1 and user2
        user1.emit('connected', { yourName: user1.name, partnerName: user2.name });
        user2.emit('connected', { yourName: user2.name, partnerName: user1.name });

        // Update currentChat to keep track of connected users
        currentChat[user1.id] = user2.id;
        currentChat[user2.id] = user1.id;

        // Remove users from the list after connection
        connectedClients.shift(); // Remove the first user
        connectedClients.shift(); // Remove the second user
    }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
