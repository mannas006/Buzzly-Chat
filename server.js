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

    // Store the socket for later use
    connectedClients.push(socket);

    // Notify the user of their assigned name
    socket.emit('connected', { yourName: randomName });

    // Check if there is another user to connect
    if (connectedClients.length > 1) {
        const otherClient = connectedClients.find(client => client.id !== socket.id);
        otherClient.emit('connected', { yourName: otherClient.name, partnerName: randomName });
        socket.emit('connected', { yourName: randomName, partnerName: otherClient.name });
        
        // Update currentChat to keep track of connected users
        currentChat[socket.id] = otherClient.id;
        currentChat[otherClient.id] = socket.id;
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
        }
        // Clear the current chat info
        delete currentChat[socket.id];
        delete currentChat[partnerId];
        socket.emit('waiting');
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

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
