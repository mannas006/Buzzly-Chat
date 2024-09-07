const socket = io('/api/chat');

const nameContainer = document.getElementById('name-container');
const nameInput = document.getElementById('name-input');
const startButton = document.getElementById('start-button');
const chatBox = document.getElementById('chat-box');
const controls = document.getElementById('controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const messagesDiv = document.getElementById('messages');

startButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
        socket.emit('setName', name);
        nameContainer.style.display = 'none';
        chatBox.style.display = 'block';
        controls.style.display = 'flex';
    }
});

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

socket.on('receiveMessage', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('waiting', () => {
    messagesDiv.innerHTML = '<div>Waiting for another user to connect...</div>';
});

socket.on('connected', (partnerName) => {
    messagesDiv.innerHTML = `<div>You are now connected with ${partnerName}. Start chatting!</div>`;
});
