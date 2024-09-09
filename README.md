# Buzzly Chat Application

**Buzzly** is a simple, real-time random chat application that connects two users at a time. Built using Node.js, Express, and Socket.io, Buzzly allows users to chat anonymously without the need for login.

## Features

- Real-time chat with random users.
- No login required; users are assigned random anime names.
- Users can send messages and skip to find a new chat partner.
- Responsive design with a modern UI.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the server:**

   ```bash
   node server.js
   ```

4. **Open your browser and navigate to `http://localhost:3001`.**

### Configuration

- **Server Configuration:** The server runs on port `3001`. You can change this by modifying the `PORT` environment variable in the `server.js` file.

- **Ngrok (for public access):**
  1. Install Ngrok from [ngrok.com](https://ngrok.com/download).
  2. Run Ngrok with the command:
     ```bash
     ngrok http 3001
     ```
  3. Use the provided Ngrok URL to access your app publicly.

### File Structure

- **`server.js`**: The main server file that sets up the Express server and Socket.io.
- **`public/index.html`**: The HTML file for the chat interface.
- **`public/styles.css`**: The CSS file for styling the chat interface.
- **`public/script.js`**: The JavaScript file that handles client-side logic and Socket.io communication.
- **`sounds/noti.mp3`**: The sound effect for receiving a message.

### Usage

- **Connect to Chat:** When the page loads, users are automatically connected to the chat.
- **Send Message:** Type a message and click the "Send" button or press Enter.
- **Skip:** Click the "Skip" button to disconnect and wait for a new chat partner.

### Troubleshooting

- **User Not Connecting:** Ensure the server is running and Ngrok (if used) is properly configured.
- **Error Messages:** Check the server logs for errors and ensure the server and client are using the correct port.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Contact

For any questions or issues, please open an issue on the [GitHub repository](<repository-url>) or contact the maintainer at [].
