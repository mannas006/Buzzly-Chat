const { createServer } = require('http');
const { Server } = require('socket.io');
const server = createServer();
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setName', (name) => {
        // Handle name setting and chat logic
    });

    socket.on('sendMessage', (message) => {
        // Handle sending messages
    });

    socket.on('skip', () => {
        // Handle skipping logic
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnection logic
    });
});

module.exports = (req, res) => {
    if (req.method === 'GET') {
        res.status(200).send('Socket.IO server is running');
    } else {
        res.status(405).send('Method Not Allowed');
    }
};
