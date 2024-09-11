const socket = io('https://buzzly-chat-application.onrender.com');
//const socket = io(); // Connect to the server

const chatBox = document.getElementById('chat-box');
const controls = document.getElementById('controls');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const skipButton = document.getElementById('skip-button');
const messagesDiv = document.getElementById('messages');
const notificationSound = document.getElementById('notification-sound'); // Add the notification sound
const chatHeader = document.querySelector('.chat-header p'); // Grab the header text

let username = ''; // Your username
let partnerName = ''; // Partner's username

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
    chatHeader.textContent = 'Waiting for another user to connect...'; // Update header text
    messagesDiv.innerHTML = ''; // Clear messages div to remove any previous connection messages
});

// Handle connection to a partner
socket.on('connected', (data) => {
    username = data.yourName; // Store your own username
    partnerName = data.partnerName || ''; // Store partner's name if available

    // Update header and input placeholder
    if (partnerName) {
        chatHeader.textContent = `Connected to ${partnerName}`; // Update header text
    } else {
        chatHeader.textContent = 'Waiting for a partner...'; // Waiting state
    }
    
    messagesDiv.innerHTML = ''; // Clear messages div to remove any previous connection messages
    messageInput.placeholder = `${username}, Type a message...`; // Update placeholder text with your username
});

window.addEventListener('load', function() {
    // Delay for 1 seconds before hiding the loading screen
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        
        // Add a fade-out transition to the loading screen
        loadingScreen.style.transition = 'opacity 0.5s ease';
        loadingScreen.style.opacity = '0';
        
        // After the transition, hide the loading screen
        setTimeout(function() {
            loadingScreen.classList.add('hidden');
        }, 500); // Time matches the transition duration
    }, 1000); // 1 seconds delay for the loading screen visibility
});
