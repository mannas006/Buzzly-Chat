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
const welcomeMessage = document.getElementById('partner-name-welcome');
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
    
    // Scroll to bottom with optimized animation
    setTimeout(() => {
        if (window.scrollToBottom) {
            window.scrollToBottom();
        } else {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
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
    
    // Initialize mobile optimizations first
    initMobileOptimizations();
    
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

// Sound chime for pairing connection
const playConnectSound = () => {
    try {
        if (notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(e => console.log('Audio element play deferred:', e));
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const audioCtx = new AudioCtx();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
        }
    } catch (e) {
        console.log('Connection chime error:', e);
    }
};

// Handle connection to a partner
socket.on('connected', (data) => {
    try {
        console.log('🤝 Connected with data:', data);
        username = data.yourName;
        partnerName = data.partnerName;

        console.log('✅ Successfully paired with:', partnerName);
        
        // Play notification sound when paired with a stranger
        playConnectSound();

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

// Mobile utility functions
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const handleMobileKeyboard = () => {
    if (!isMobile()) return;
    
    let initialViewportHeight = window.innerHeight;
    
    const adjustForKeyboard = () => {
        if (window.scrollToBottom) {
            window.scrollToBottom(false);
        }
    };
    
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', adjustForKeyboard);
    }
    
    if (messageInput) {
        messageInput.addEventListener('focus', () => {
            setTimeout(adjustForKeyboard, 200);
            setTimeout(adjustForKeyboard, 400);
        });
    }
    
    window.addEventListener('orientationchange', () => {
        setTimeout(adjustForKeyboard, 300);
    });
};

const optimizeScrolling = () => {
    if (!messagesContainer) return;
    
    // Smooth scrolling for messages
    const scrollToBottom = (smooth = true) => {
        const scrollOptions = {
            top: messagesContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        };
        
        if (isMobile()) {
            // On mobile, use immediate scroll for better performance
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            messagesContainer.scrollTo(scrollOptions);
        }
    };
    
    // Enhanced scroll to bottom function
    window.scrollToBottom = scrollToBottom;
};

const addTouchFeedback = () => {
    if (!isMobile()) return;
    
    const buttons = document.querySelectorAll('.action-button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        }, { passive: true });
        
        button.addEventListener('touchend', function(e) {
            setTimeout(() => {
                this.style.transform = '';
                this.style.opacity = '';
            }, 150);
        }, { passive: true });
        
        button.addEventListener('touchcancel', function(e) {
            this.style.transform = '';
            this.style.opacity = '';
        }, { passive: true });
    });
};

const preventZoom = () => {
    if (!isMobile()) return;
    
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevent pinch zoom
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    
    document.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    });
    
    document.addEventListener('gestureend', function (e) {
        e.preventDefault();
    });
};

const initMobileOptimizations = () => {
    if (isMobile()) {
        console.log('📱 Mobile device detected - applying optimizations');
        
        // Add mobile class to body
        document.body.classList.add('mobile-device');
        
        if (isIOS()) {
            document.body.classList.add('ios-device');
        }
        
        // Initialize mobile features
        handleMobileKeyboard();
        addTouchFeedback();
        preventZoom();
        optimizeScrolling();
        
        // Improve touch scrolling on iOS
        if (isIOS() && messagesContainer) {
            messagesContainer.style.webkitOverflowScrolling = 'touch';
        }
        
        // Hide address bar on mobile browsers
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 0);
    }
};

initMobileOptimizations();

console.log('🎉 Buzzly Chat initialized successfully!');
