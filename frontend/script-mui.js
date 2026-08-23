const socketServerUrl = window.SOCKET_SERVER_URL || window.location.origin;
const socket = io(socketServerUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
    transports: ['websocket', 'polling']
});

console.log('🚀 Buzzly Chat - Socket.io client initialized');

// Global state
let username = '';
let partnerName = '';
let isConnected = false;
let isReady = false;
let connectionStartTime = Date.now();

// DOM elements
const appContainer = document.getElementById('app-container');
const loadingScreen = document.getElementById('loading-screen');
const statusChip = document.getElementById('status-chip');
const statusIcon = statusChip.querySelector('.status-icon');
const statusText = statusChip.querySelector('.status-text');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const welcomeMessage = document.getElementById('welcome-message');
const partnerNameWelcome = document.getElementById('partner-name-welcome');
const notificationSound = document.getElementById('notification-sound');

// Utility functions
const updateStatus = (status, text, icon) => {
    statusChip.className = `status-chip ${status}`;
    statusText.textContent = text;
    statusIcon.textContent = icon;
};

const showApp = () => {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            appContainer.style.opacity = '1';
            appContainer.style.visibility = 'visible';
        }, 500);
    }, 1000);
};

const addMessage = (sender, content, isOwn = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'sent' : 'received'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isOwn ? 'You' : sender.charAt(0);
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = content;
    
    if (isOwn) {
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom with smooth animation
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
    
    // Play notification sound for received messages
    if (!isOwn && notificationSound) {
        notificationSound.play().catch(e => {
            console.log('Could not play notification sound:', e);
        });
    }
};

const clearMessages = () => {
    messagesContainer.innerHTML = '';
    welcomeMessage.style.display = 'none';
};

const showWelcomeMessage = (partner) => {
    clearMessages();
    partnerNameWelcome.textContent = partner;
    welcomeMessage.style.display = 'block';
    setTimeout(() => {
        welcomeMessage.style.display = 'none';
    }, 3000);
};

const sendMessage = () => {
    const message = messageInput.value.trim();
    if (message && isConnected && partnerName && isReady) {
        socket.emit('sendMessage', message);
        addMessage('You', message, true);
        messageInput.value = '';
    }
};

// Initialize app once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    showApp();
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
    
    skipButton.addEventListener('click', () => {
        if (isConnected && isReady) {
            console.log('🔄 Requesting skip to new partner');
            socket.emit('skip');
            skipButton.disabled = true;
        }
    });
});

// Socket event handlers
socket.on('connect', () => {
    const connectionTime = Date.now() - connectionStartTime;
    console.log('✅ Connected to server with ID:', socket.id);
    console.log('⏱️ Connection took:', connectionTime, 'ms');
    isConnected = true;
    updateStatus('connecting', 'Getting your name...', '🔄');
});

socket.on('name_assigned', (data) => {
    console.log('📝 Name assigned:', data.yourName);
    username = data.yourName;
    messageInput.placeholder = `${username}, type a message...`;
    updateStatus('waiting', 'Looking for someone to chat...', '🔍');
    
    // Signal that we're ready for pairing
    if (!isReady) {
        isReady = true;
        console.log('🚀 Sending ready signal to server');
        socket.emit('ready');
        
        // Enable input and buttons
        messageInput.disabled = false;
        sendButton.disabled = false;
        skipButton.disabled = false;
    }
});

socket.on('disconnect', (reason) => {
    const connectionDuration = Date.now() - connectionStartTime;
    console.log('❌ Disconnected from server. Reason:', reason);
    console.log('⏱️ Connection lasted:', connectionDuration, 'ms');
    isConnected = false;
    isReady = false;
    partnerName = '';
    
    updateStatus('disconnected', 'Disconnected - Reconnecting...', '❌');
    
    // Disable input and buttons
    messageInput.disabled = true;
    sendButton.disabled = true;
    skipButton.disabled = true;
});

socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Reconnected to server on attempt:', attemptNumber);
    isConnected = true;
    isReady = false;
    connectionStartTime = Date.now();
    updateStatus('connecting', 'Reconnected - Getting your name...', '🔄');
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    updateStatus('disconnected', 'Connection error', '❌');
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

// Handle incoming messages
socket.on('receiveMessage', (message) => {
    try {
        console.log('📨 Received message:', message);
        const { sender, content } = message;
        addMessage(sender, content, false);
    } catch (error) {
        console.error('Error handling received message:', error);
    }
});

// Handle waiting state
socket.on('waiting', () => {
    try {
        console.log('📋 Entered waiting state');
        partnerName = '';
        updateStatus('waiting', 'Looking for someone to chat...', '🔍');
        clearMessages();
        skipButton.disabled = false;
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
        
        updateStatus('connected', `Chatting with ${partnerName}`, '💬');
        messageInput.placeholder = `${username}, type a message...`;
        showWelcomeMessage(partnerName);
        skipButton.disabled = false;
        
        // Focus on message input
        setTimeout(() => {
            messageInput.focus();
        }, 500);
    } catch (error) {
        console.error('❌ Error handling connected state:', error);
    }
});

// Heartbeat mechanism
setInterval(() => {
    if (socket.connected) {
        socket.emit('heartbeat');
    }
}, 15000);

// Heartbeat acknowledgment
socket.on('heartbeat_ack', () => {
    // Keep connection alive
});

console.log('🎉 Buzzly Chat initialized successfully!');
