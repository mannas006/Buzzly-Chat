const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

// Create an Express application
const app = express();
const server = http.createServer(app);

// Create a new instance of Socket.IO
const io = new Server(server);

// Middleware to serve static files
app.use(express.static('public'));

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setName', (name) => {
        socket.name = name;
        // Notify the user that they are connected
        socket.emit('connected', name);
        // Broadcast that a new user has joined
        socket.broadcast.emit('waiting');
    });

    socket.on('sendMessage', (message) => {
        io.emit('receiveMessage', `${socket.name}: ${message}`);
    });

    socket.on('skip', () => {
        io.emit('waiting');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
