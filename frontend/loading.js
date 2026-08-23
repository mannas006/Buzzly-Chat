document.addEventListener("DOMContentLoaded", function () {
    const loadingScreen = document.getElementById("loading-screen");
    const chatBox = document.getElementById("chat-box");

    // Add event listener to check if the entire page has fully loaded
    window.addEventListener("load", function () {
        // Delay to simulate loading time (optional)
        setTimeout(function () {
            // Hide the loading screen and show the chat interface
            loadingScreen.style.opacity = 0;
            loadingScreen.style.visibility = 'hidden';

            // Display the chat box with a fade-in effect
            chatBox.style.opacity = 1;
            chatBox.style.visibility = 'visible';
        }, 1000); // 1-second delay for smoother transition (optional)
    });
});
