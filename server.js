const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let users = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    if (users.length > 0) {
        const partner = users.pop();
        socket.emit('receiveMessage', 'You are now connected with someone. Start chatting!');
        io.to(partner).emit('receiveMessage', 'You are now connected with someone. Start chatting!');
        socket.on('sendMessage', (message) => {
            io.to(partner).emit('receiveMessage', message);
        });
        socket.on('skip', () => {
            socket.emit('receiveMessage', 'You have skipped. Wait for another user.');
            io.to(partner).emit('receiveMessage', 'Your chat partner has skipped. You are now waiting for a new user.');
            users.push(partner);
            users.push(socket.id);
        });
    } else {
        users.push(socket.id);
        socket.emit('receiveMessage', 'Waiting for another user to connect...');
    }

    socket.on('disconnect', () => {
        console.log('User disconnected');
        users = users.filter(user => user !== socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
