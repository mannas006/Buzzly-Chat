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
    } else {
        socket.emit('waiting');
    }

    socket.on('sendMessage', (message) => {
        io.emit('receiveMessage', { sender: socket.name, content: message });
    });

    socket.on('skip', () => {
        socket.emit('waiting');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove the client from the list
        connectedClients = connectedClients.filter(client => client.id !== socket.id);

        // Notify other clients if needed
        if (connectedClients.length > 0) {
            connectedClients.forEach(client => client.emit('waiting'));
        }
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
