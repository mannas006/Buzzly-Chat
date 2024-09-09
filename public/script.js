//const socket = io(); // Connect to the server
const socket = io('https://buzzly-chat-application.onrender.com');

const chatBox = document.getElementById('chat-box');
const controls = document.getElementById('controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const messagesDiv = document.getElementById('messages');
const notificationSound = document.getElementById('notification-sound'); // Add the notification sound

// Display chat box
chatBox.style.display = 'block';
controls.style.display = 'flex';

// Function to send message
function sendMessage() {
    const message = messageInput.value;
    if (message.trim()) {
        // Emit your message to the server
        socket.emit('sendMessage', message);
        
        // Display your own message on the right side
        displayMessage('You', message, 'sent');
        messageInput.value = '';
    }
}

// Function to display messages
function displayMessage(sender, message, type) {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    messageElement.classList.add('message', type);
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add event listener for send button
sendButton.addEventListener('click', sendMessage);

// Add event listener for Enter key to send message
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// Add event listener for skip button
skipButton.addEventListener('click', () => {
    socket.emit('skip');
});

// Heartbeat mechanism
setInterval(() => {
    socket.emit('heartbeat');
}, 5000);

// Handle incoming messages (from other users)
socket.on('receiveMessage', (message) => {
    const { sender, content } = message; // Destructure sender and content from the message object
    displayMessage(sender, content, 'received');
    
    // Play notification sound for received messages
    notificationSound.play();
});

// Handle waiting state
socket.on('waiting', () => {
    messagesDiv.innerHTML = '<div class="alert alert-info">Waiting for another user to connect...</div>';
});

// Handle connection to a partner
socket.on('connected', (partnerName) => {
    messagesDiv.innerHTML = `<div class="alert alert-success">You are now connected with ${partnerName}. Start chatting!</div>`;
});
