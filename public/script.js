//const socket = io(); // Connect to the server
const socket = io('https://buzzly-chat-application.onrender.com');

const chatBox = document.getElementById('chat-box');
const controls = document.getElementById('controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const messagesDiv = document.getElementById('messages');

// Display chat box
chatBox.style.display = 'block';
controls.style.display = 'flex';

// Function to send message
function sendMessage() {
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
}

// Add event listener for send button
sendButton.addEventListener('click', sendMessage);

// Add event listener for Enter key
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

// Handle incoming messages
socket.on('receiveMessage', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.classList.add('message');
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Handle waiting state
socket.on('waiting', () => {
    messagesDiv.innerHTML = '<div class="alert alert-info">Waiting for another user to connect...</div>';
});

// Handle connection to a partner
socket.on('connected', (partnerName) => {
    messagesDiv.innerHTML = `<div class="alert alert-success">You are now connected with ${partnerName}. Start chatting!</div>`;
});
