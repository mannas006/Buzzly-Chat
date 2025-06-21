//const socket = io('https://buzzlychat.azurewebsites.net', {
const socket = io({
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
    transports: ['websocket', 'polling']
}); // Connect to the local server with enhanced configuration

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
            
            // Force enable input after app is shown (fallback)
            setTimeout(() => {
                if (messageInput && isReady) {
                    messageInput.disabled = false;
                    console.log('Fallback: Input enabled after app shown');
                }
            }, 100);
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
    const message = messageInput?.value?.trim();
    console.log('Send message attempt:', {
        messageLength: message?.length,
        isConnected,
        partnerName: !!partnerName,
        isReady,
        inputDisabled: messageInput?.disabled,
        sendButtonDisabled: sendButton?.disabled,
        hasMessage: !!message,
        hasPartner: !!partnerName
    });
    
    if (message && isConnected && partnerName && isReady) {
        console.log('✅ Sending message (length:', message.length, ')');
        socket.emit('sendMessage', message);
        addMessage('You', message, true);
        messageInput.value = '';
    } else {
        console.log('❌ Message send blocked - conditions not met:', {
            hasMessage: !!message,
            isConnected,
            hasPartner: !!partnerName,
            isReady
        });
    }
};

// Initialize app once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Check if DOM elements are found
    console.log('DOM elements check:', {
        appContainer: !!appContainer,
        loadingScreen: !!loadingScreen,
        statusChip: !!statusChip,
        messageInput: !!messageInput,
        sendButton: !!sendButton,
        skipButton: !!skipButton
    });
    
    showApp();
    
    // Event listeners
    if (sendButton) {
        sendButton.addEventListener('click', (event) => {
            console.log('🖱️ Send button clicked');
            event.preventDefault();
            sendMessage();
        });
    } else {
        console.error('❌ Send button not found');
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            console.log('⌨️ Key pressed in input:', event.key);
            if (event.key === 'Enter' && !event.shiftKey) {
                console.log('✅ Enter key detected - sending message');
                event.preventDefault();
                sendMessage();
            }
        });
    } else {
        console.error('❌ Message input not found');
    }
    
    if (skipButton) {
        skipButton.addEventListener('click', () => {
            if (isConnected && isReady) {
                console.log('🔄 Requesting skip to new partner');
                socket.emit('skip');
                skipButton.disabled = true;
            }
        });
    }
});

// Socket event handlers
socket.on('connect', () => {
    const connectionTime = Date.now() - connectionStartTime;
    console.log('✅ Connected to server with ID:', socket.id);
    console.log('⏱️ Connection took:', connectionTime, 'ms');
    isConnected = true;
    updateStatus('connecting', 'Getting your name...', '✨');
});

socket.on('name_assigned', (data) => {
    console.log('📝 Name assigned:', data.yourName);
    username = data.yourName;
    
    if (messageInput) {
        messageInput.placeholder = `${username}, type a message...`;
    }
    updateStatus('waiting', 'Looking for someone to chat...', '�');
    
    // Signal that we're ready for pairing
    if (!isReady) {
        isReady = true;
        console.log('🚀 Sending ready signal to server');
        socket.emit('ready');
        
        // Enable input and buttons
        console.log('Enabling input and buttons...');
        if (messageInput) {
            messageInput.disabled = false;
            console.log('Message input enabled:', !messageInput.disabled);
        }
        if (sendButton) {
            sendButton.disabled = false;
        }
        if (skipButton) {
            skipButton.disabled = false;
        }
    }
});

socket.on('disconnect', (reason) => {
    const connectionDuration = Date.now() - connectionStartTime;
    console.log('❌ Disconnected from server. Reason:', reason);
    console.log('⏱️ Connection lasted:', connectionDuration, 'ms');
    isConnected = false;
    isReady = false;
    partnerName = '';
    
    updateStatus('disconnected', 'Connection lost - Reconnecting...', '🔄');
    
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
    updateStatus('connecting', 'Reconnected - Getting your name...', '✨');
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    updateStatus('disconnected', 'Connection error', '⚠️');
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

// Handle incoming messages
socket.on('receiveMessage', (message) => {
    try {
        console.log('📨 Received message (length:', message?.content?.length || 0, ')');
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
        updateStatus('waiting', 'Looking for someone to chat...', '�');
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
        
        if (messageInput) {
            messageInput.placeholder = `${username}, type a message...`;
            messageInput.disabled = false; // Ensure input is enabled when connected
            console.log('Input enabled for chatting with partner');
        }
        
        if (sendButton) {
            sendButton.disabled = false; // Ensure send button is enabled when connected
            console.log('Send button enabled for chatting with partner');
        }
        
        showWelcomeMessage(partnerName);
        
        if (skipButton) {
            skipButton.disabled = false;
        }
        
        // Focus on message input
        setTimeout(() => {
            if (messageInput) {
                messageInput.focus();
            }
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
