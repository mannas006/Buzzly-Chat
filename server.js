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
const usedNames = new Set(); // Set to keep track of used names
let waitingClients = []; // Queue for clients waiting for a partner
let currentChat = {}; // Keeps track of the current chat partners

// Function to get a random anime name that is not already used
function getRandomName() {
    let name;
    do {
        name = animeNames[Math.floor(Math.random() * animeNames.length)];
    } while (usedNames.has(name) && usedNames.size < animeNames.length); // Ensure name is unique
    usedNames.add(name);
    return name;
}

// Handle new connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign a random name to the socket
    const randomName = getRandomName();
    socket.name = randomName;

    // Store the socket for later use
    waitingClients.push(socket);

    // Notify the user of their assigned name
    socket.emit('connected', { yourName: randomName });

    // Check if there is another user to connect
    if (waitingClients.length > 1) {
        const otherClient = waitingClients.find(client => client.id !== socket.id);
        if (otherClient) {
            otherClient.emit('connected', { yourName: otherClient.name, partnerName: randomName });
            socket.emit('connected', { yourName: randomName, partnerName: otherClient.name });
            
            // Update currentChat to keep track of connected users
            currentChat[socket.id] = otherClient.id;
            currentChat[otherClient.id] = socket.id;

            // Remove connected clients from the waiting list
            waitingClients = waitingClients.filter(client => client.id !== socket.id && client.id !== otherClient.id);
        }
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

        // Remove the user from the current chat and waiting list
        delete currentChat[socket.id];
        if (partnerId) {
            delete currentChat[partnerId];
        }

        // Re-add the skipped client to the waiting list
        if (partnerId) {
            waitingClients.push(io.sockets.sockets.get(partnerId));
        }
        waitingClients.push(socket);

        socket.emit('waiting');
        // Attempt to connect with a new partner
        if (waitingClients.length > 1) {
            const otherClient = waitingClients.find(client => client.id !== socket.id);
            if (otherClient) {
                otherClient.emit('connected', { yourName: otherClient.name, partnerName: randomName });
                socket.emit('connected', { yourName: randomName, partnerName: otherClient.name });

                currentChat[socket.id] = otherClient.id;
                currentChat[otherClient.id] = socket.id;

                // Remove connected clients from the waiting list
                waitingClients = waitingClients.filter(client => client.id !== socket.id && client.id !== otherClient.id);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove the client from the waiting list
        waitingClients = waitingClients.filter(client => client.id !== socket.id);

        // Notify the partner client that the current user has disconnected
        const partnerId = currentChat[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('waiting');
            delete currentChat[partnerId];
        }
        delete currentChat[socket.id];

        // Remove the used name from the set of used names
        usedNames.delete(socket.name);
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
