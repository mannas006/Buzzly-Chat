const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let users = [];
let userNames = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setName', (name) => {
        userNames[socket.id] = name;

        if (users.length > 0) {
            const partner = users.pop();
            const partnerName = userNames[partner];
            socket.emit('connected', partnerName);
            io.to(partner).emit('connected', userNames[socket.id]);

            // Forward messages between users
            socket.on('sendMessage', (message) => {
                io.to(partner).emit('receiveMessage', `${userNames[socket.id]}: ${message}`);
                socket.emit('receiveMessage', `You: ${message}`);
            });

            socket.on('skip', () => {
                socket.emit('receiveMessage', 'You have skipped. Wait for another user.');
                io.to(partner).emit('receiveMessage', 'Your chat partner has skipped. You are now waiting for a new user.');
                users.push(partner);
                users.push(socket.id);
            });

        } else {
            users.push(socket.id);
            socket.emit('waiting');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        users = users.filter(user => user !== socket.id);
        delete userNames[socket.id];
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


// api/chat.js (or any name inside 'api' folder)
const { createServer } = require('http');
const { Server } = require('socket.io');
const io = new Server(createServer());

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setName', (name) => {
        // Your existing logic
    });

    socket.on('sendMessage', (message) => {
        // Your existing logic
    });

    socket.on('skip', () => {
        // Your existing logic
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Your existing logic
    });
});

module.exports = (req, res) => {
    if (req.method === 'GET') {
        // Handle GET requests
        res.status(200).send('Socket.IO server is running');
    } else {
        res.status(405).send('Method Not Allowed');
    }
};
