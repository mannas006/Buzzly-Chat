const socket = io(); // Connect to the server
//const socket = io('https://random-chat-app-hp9d.onrender.com');

const chatBox = document.getElementById('chat-box');
const controls = document.getElementById('controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const messagesDiv = document.getElementById('messages');

// Display chat box
chatBox.style.display = 'block';
controls.style.display = 'flex';

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
});

skipButton.addEventListener('click', () => {
    socket.emit('skip');
});

// Heartbeat mechanism
setInterval(() => {
    socket.emit('heartbeat');
}, 5000);

socket.on('receiveMessage', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('waiting', () => {
    messagesDiv.innerHTML = '<div class="alert alert-info">Waiting for another user to connect...</div>';
});

socket.on('connected', (partnerName) => {
    messagesDiv.innerHTML = `<div class="alert alert-success">You are now connected with ${partnerName}. Start chatting!</div>`;
});