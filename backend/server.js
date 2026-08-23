const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

const path = require('path');

// Serve static frontend files for seamless local development
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Health check endpoint for Dokploy / container orchestrators
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

const animeNames = [
    'Shinji', 'Gendo', 'Rei', 'Asuka', 'Misato',
    'Yagami', 'Mikasa', 'Eren', 'Armin', 'Levi', 'Gon',
    'Killua', 'Kurapika', 'Hisoka', 'Chrollo',
    'Tanjiro', 'Nezuko', 'Zenitsu', 'Inosuke', 'Kanao',
    'Rengoku', 'Shinobu', 'Tengen', 'Muzan', 'Ufotable',
    'Yuu', 'Mitsuha', 'Taki', 'Denji', 'Makima',
    'Power', 'Aki', 'Kishibe', 'Himeno', 'Kobeni'
];

// Enhanced user management
const users = new Map(); // socket.id -> user data
const waitingQueue = new Set(); // Set of socket IDs waiting for partners
const chatPairs = new Map(); // socket.id -> partner socket.id

// Function to get a random anime name that is not already used
function getRandomName() {
    const usedNames = new Set(Array.from(users.values()).map(user => user.name));
    const availableNames = animeNames.filter(name => !usedNames.has(name));
    
    if (availableNames.length === 0) {
        // If all names are used, add numbers to names
        return animeNames[Math.floor(Math.random() * animeNames.length)] + Math.floor(Math.random() * 1000);
    }
    
    return availableNames[Math.floor(Math.random() * availableNames.length)];
}

// Function to find and pair waiting users
function tryPairUsers() {
    if (waitingQueue.size < 2) return;
    
    const waitingArray = Array.from(waitingQueue);
    const user1Id = waitingArray[0];
    const user2Id = waitingArray[1];
    
    const user1Socket = io.sockets.sockets.get(user1Id);
    const user2Socket = io.sockets.sockets.get(user2Id);
    
    // Verify both sockets still exist and are connected
    if (!user1Socket || !user2Socket || !user1Socket.connected || !user2Socket.connected) {
        // Clean up invalid sockets
        waitingQueue.delete(user1Id);
        waitingQueue.delete(user2Id);
        if (!user1Socket || !user1Socket.connected) users.delete(user1Id);
        if (!user2Socket || !user2Socket.connected) users.delete(user2Id);
        return tryPairUsers(); // Try again with remaining users
    }
    
    const user1 = users.get(user1Id);
    const user2 = users.get(user2Id);
    
    if (!user1 || !user2) {
        waitingQueue.delete(user1Id);
        waitingQueue.delete(user2Id);
        return tryPairUsers();
    }
    
    // Remove from waiting queue
    waitingQueue.delete(user1Id);
    waitingQueue.delete(user2Id);
    
    // Create chat pair
    chatPairs.set(user1Id, user2Id);
    chatPairs.set(user2Id, user1Id);
    
    // Update user states
    user1.state = 'chatting';
    user2.state = 'chatting';
    user1.partnerId = user2Id;
    user2.partnerId = user1Id;
    
    console.log(`Paired: ${user1.name} ↔ ${user2.name}`);
    
    // Notify both users
    user1Socket.emit('connected', {
        yourName: user1.name,
        partnerName: user2.name
    });
    
    user2Socket.emit('connected', {
        yourName: user2.name,
        partnerName: user1.name
    });
}

// Function to clean up user data
function cleanupUser(socketId) {
    const user = users.get(socketId);
    if (user && user.partnerId) {
        // Notify partner about disconnection
        const partnerSocket = io.sockets.sockets.get(user.partnerId);
        if (partnerSocket && partnerSocket.connected) {
            const partner = users.get(user.partnerId);
            if (partner) {
                partner.state = 'waiting';
                partner.partnerId = null;
                waitingQueue.add(user.partnerId);
                partnerSocket.emit('waiting');
                console.log(`${partner.name} moved to waiting after disconnect`);
            }
        }
        chatPairs.delete(user.partnerId);
    }
    
    chatPairs.delete(socketId);
    waitingQueue.delete(socketId);
    users.delete(socketId);
    
    if (user) {
        console.log(`Cleaned up: ${user.name}`);
    }
}

// Handle new connections
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Initialize user data
    const userData = {
        name: getRandomName(),
        state: 'waiting',
        partnerId: null,
        connectedAt: Date.now()
    };
    
    users.set(socket.id, userData);
    socket.name = userData.name; // For backward compatibility
    
    console.log(`${userData.name} connected`);
    
    // Send initial name assignment
    socket.emit('name_assigned', {
        yourName: userData.name
    });
    
    // Handle ready signal from client
    socket.on('ready', () => {
        console.log(`${userData.name} ready for pairing`);
        userData.state = 'waiting';
        waitingQueue.add(socket.id);
        
        // Try to pair with another waiting user
        tryPairUsers();
        
        // If still waiting after pairing attempt, send waiting state
        if (waitingQueue.has(socket.id)) {
            socket.emit('waiting');
        }
    });

    socket.on('sendMessage', (message) => {
        try {
            console.log(`📤 Message received from ${socket.id} (length: ${message?.length || 0})`);
            const user = users.get(socket.id);
            
            if (!user || user.state !== 'chatting' || !user.partnerId) {
                console.log(`❌ Message blocked - invalid user state`);
                return;
            }
            
            const partnerSocket = io.sockets.sockets.get(user.partnerId);
            
            if (partnerSocket && partnerSocket.connected) {
                console.log(`✅ Message forwarded to partner`);
                partnerSocket.emit('receiveMessage', {
                    sender: user.name,
                    content: message
                });
            } else {
                console.log(`❌ Partner disconnected, moving user back to waiting`);
                // Partner disconnected, move this user back to waiting
                user.state = 'waiting';
                user.partnerId = null;
                chatPairs.delete(socket.id);
                waitingQueue.add(socket.id);
                socket.emit('waiting');
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);
        }
    });

    socket.on('skip', () => {
        try {
            const user = users.get(socket.id);
            if (!user) {
                console.log(`Skip request from unknown user: ${socket.id}`);
                return;
            }
            
            console.log(`${user.name} requested skip`);
            
            if (user.partnerId) {
                // Notify partner and move them to waiting
                const partnerSocket = io.sockets.sockets.get(user.partnerId);
                if (partnerSocket && partnerSocket.connected) {
                    const partner = users.get(user.partnerId);
                    if (partner) {
                        partner.state = 'waiting';
                        partner.partnerId = null;
                        waitingQueue.add(user.partnerId);
                        partnerSocket.emit('waiting');
                        console.log(`${partner.name} moved to waiting after skip`);
                    }
                }
                
                // Clean up chat pair
                chatPairs.delete(socket.id);
                chatPairs.delete(user.partnerId);
            }
            
            // Reset user state and add to waiting queue
            user.state = 'waiting';
            user.partnerId = null;
            waitingQueue.add(socket.id);
            socket.emit('waiting');
            
            // Try to find new pairs
            setTimeout(() => {
                tryPairUsers();
            }, 100); // Small delay to ensure state is updated
            
        } catch (error) {
            console.error('Error in skip handler:', error);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
        cleanupUser(socket.id);
        
        // Try to pair remaining users after cleanup
        setTimeout(() => {
            tryPairUsers();
        }, 100);
    });

    // Heartbeat mechanism
    socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack');
    });

    // Error handling
    socket.on('error', (error) => {
        console.error('Socket error for:', socket.id, error);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
