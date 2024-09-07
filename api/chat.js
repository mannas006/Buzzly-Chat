const { createServer } = require('http');
const { Server } = require('socket.io');
const io = new Server(createServer());

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setName', (name) => {
        socket.name = name;
        socket.emit('connected', name);
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

module.exports = (req, res) => {
    if (req.method === 'GET') {
        res.status(200).send('Socket.IO server is running');
    } else {
        res.status(405).send('Method Not Allowed');
    }
};
