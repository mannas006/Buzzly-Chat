const socketServerUrl = window.SOCKET_SERVER_URL || window.location.origin;
const socket = io(socketServerUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
    transports: ['websocket', 'polling']
});

// Expose socket globally for React component
window.socket = socket;

console.log('Socket.io client initialized');

let username = '';
let partnerName = '';
let isConnected = false;
let isReady = false;
let connectionStartTime = Date.now();

// Wait for chatApp to be available
const waitForChatApp = () => {
    return new Promise((resolve) => {
        const checkChatApp = () => {
            if (window.chatApp) {
                resolve(window.chatApp);
            } else {
                setTimeout(checkChatApp, 100);
            }
        };
        checkChatApp();
    });
};

// Initialize chat app integration
waitForChatApp().then((chatApp) => {
    console.log('Chat app integration ready');
});

// Socket connection events
socket.on('connect', () => {
    const connectionTime = Date.now() - connectionStartTime;
    console.log('✅ Connected to server with ID:', socket.id);
    console.log('⏱️ Connection took:', connectionTime, 'ms');
    isConnected = true;
    
    waitForChatApp().then((chatApp) => {
        chatApp.setStatus('connecting');
    });
});

socket.on('name_assigned', (data) => {
    console.log('📝 Name assigned:', data.yourName);
    username = data.yourName;
    
    waitForChatApp().then((chatApp) => {
        chatApp.setUsername(username);
        chatApp.setStatus('waiting');
    });
    
    // Signal that we're ready for pairing
    if (!isReady) {
        isReady = true;
        console.log('🚀 Sending ready signal to server');
        socket.emit('ready');
        
        waitForChatApp().then((chatApp) => {
            chatApp.setReady(true);
        });
    }
});

socket.on('disconnect', (reason) => {
    const connectionDuration = Date.now() - connectionStartTime;
    console.log('❌ Disconnected from server. Reason:', reason);
    console.log('⏱️ Connection lasted:', connectionDuration, 'ms');
    isConnected = false;
    isReady = false;
    partnerName = '';
    
    waitForChatApp().then((chatApp) => {
        chatApp.setStatus('disconnected');
        chatApp.setPartnerName('');
        chatApp.setReady(false);
    });
});

socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Reconnected to server on attempt:', attemptNumber);
    isConnected = true;
    isReady = false; // Will be set to true when name is assigned again
    connectionStartTime = Date.now();
    
    waitForChatApp().then((chatApp) => {
        chatApp.setStatus('connecting');
    });
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    waitForChatApp().then((chatApp) => {
        chatApp.setStatus('disconnected');
    });
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

// Enhanced heartbeat mechanism
setInterval(() => {
    if (socket.connected) {
        socket.emit('heartbeat');
    }
}, 15000); // Every 15 seconds

// Handle incoming messages (from other users)
socket.on('receiveMessage', (message) => {
    try {
        console.log('Received message:', message);
        const { sender, content } = message;
        
        waitForChatApp().then((chatApp) => {
            chatApp.addMessage(sender, content, false);
        });
        
        // Play notification sound for received messages
        const notificationSound = document.getElementById('notification-sound');
        if (notificationSound) {
            notificationSound.play().catch(e => {
                console.log('Could not play notification sound:', e);
            });
        }
    } catch (error) {
        console.error('Error handling received message:', error);
    }
});

// Handle waiting state
socket.on('waiting', () => {
    try {
        console.log('📋 Entered waiting state');
        partnerName = '';
        
        waitForChatApp().then((chatApp) => {
            chatApp.setStatus('waiting');
            chatApp.setPartnerName('');
            chatApp.clearMessages();
        });
    } catch (error) {
        console.error('❌ Error handling waiting state:', error);
    }
});

// Handle connection to a partner
socket.on('connected', (data) => {
    try {
        console.log('🤝 Connected with data:', data);
        username = data.yourName;
        partnerName = data.partnerName;

        console.log('✅ Successfully paired with:', partnerName);
        
        waitForChatApp().then((chatApp) => {
            chatApp.setStatus('connected');
            chatApp.setUsername(username);
            chatApp.setPartnerName(partnerName);
            chatApp.clearMessages();
        });
    } catch (error) {
        console.error('❌ Error handling connected state:', error);
    }
});

// Heartbeat acknowledgment
socket.on('heartbeat_ack', () => {
    // Keep connection alive
});
