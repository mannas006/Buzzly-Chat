<div align="center">
  <img src="frontend/image/logo-color.png" alt="Buzzly Chat" width="200" height="auto">
  
  # 🚀 Buzzly Chat

  **Anonymous Real-Time Random Chat Application**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2022.x-green.svg)](https://nodejs.org/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-4.x-blue.svg)](https://socket.io/)
  [![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
  [![Dokploy VPS](https://img.shields.io/badge/Backend-Dokploy%20VPS-purple)](https://dokploy.com)

  *Connect instantly with strangers worldwide. Decoupled architecture with a Vercel-hosted frontend and Dokploy VPS backend.*
</div>

---

## ✨ Overview

**Buzzly Chat** is a modern, real-time random chat application that connects users anonymously for instant conversations. Built with a decoupled monorepo architecture, the static frontend is optimized for global edge delivery via **Vercel**, while the long-lived WebSocket backend runs inside Docker on **Dokploy VPS**.

---

## 🌟 Key Features

- **🎭 Anonymous Chatting** — Random temporary identities (Anime-themed names) without registration or personal data logging.
- **⚡ Real-Time WebSockets** — Low-latency bidirectional messaging powered by Socket.IO.
- **⏭️ Skip & Pair System** — Instant O(1) partner matching and automatic re-queuing upon skip or disconnect.
- **🎨 Modern Responsive UI** — Material Design-inspired aesthetic with audio notification support.
- **🏗️ Decoupled Monorepo Architecture** — Clean separation into `frontend/`, `backend/`, and `tests/` directories for effortless scaling.

---

## 📁 Repository Structure

```text
Buzzly-Chat/
├── 📁 backend/                # Express & Socket.IO server engine
│   ├── 🐳 Dockerfile          # Production Docker build setup for Dokploy
│   ├── 📦 package.json        # Server dependencies
│   └── 📜 server.js           # Real-time user pairing & heartbeat logic
│
├── 📁 frontend/               # Static client UI assets (Deployed to Vercel)
│   ├── ⚙️ config.js           # Dynamic environment target resolver
│   ├── 🌐 index.html          # Main HTML entrypoint (Socket.IO CDN)
│   ├── 📜 script.js           # Client socket event handlers & state
│   ├── 🎨 styles.css          # Application styles
│   ├── 🖼️ image/             # Logos & icons
│   └── 🔊 sounds/            # Audio alerts
│
├── 📁 tests/                  # Connection benchmark pages & test HTMLs
│   ├── 🧪 connection-test.html
│   └── 🧪 test-mui.html
│
└── 📄 README.md               # Project documentation
```

---

## 🛠️ Technology Stack

| Component | Technology | Version / Platform |
|---|---|---|
| **Backend Engine** | Node.js + Express | v18+ / v22+ |
| **Real-Time Layer** | Socket.IO | 4.7.x |
| **Backend Deployment** | Docker + Traefik | **Dokploy VPS** |
| **Frontend UI** | Vanilla JS (ES6+) + CSS3 | **Vercel (Global CDN)** |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

### 1. Clone & Install
```bash
git clone https://github.com/mannas006/Buzzly-Chat.git
cd Buzzly-Chat/backend
npm install
```

### 2. Run Server
```bash
npm start
```

### 3. Open in Browser
Open `http://localhost:3000` in your web browser. Local development automatically serves the static frontend and connects WebSockets to `http://localhost:3000`.

---

## 🌐 Production Hosting Guide

### Step 1: Deploy Backend to Dokploy VPS
1. Open **Dokploy Dashboard** -> **Create Application**.
2. Select **Provider: GitHub** and choose `Buzzly-Chat` repo.
3. Configure application settings:
   - **Root Directory**: `./backend`
   - **Build Type**: `Dockerfile`
   - **Port**: `3000`
   - **Environment Variable**: `PORT=3000`
4. Go to **Domains**, set your API domain (e.g. `https://buzzly-api.yourdomain.com`), and enable **Let's Encrypt HTTPS**.
5. Click **Deploy**.

### Step 2: Configure Backend URL in Frontend
Edit [`frontend/config.js`](file:///Users/manas/Buzzly-Chat/frontend/config.js) and set your Dokploy domain:

```javascript
window.SOCKET_SERVER_URL = window.SOCKET_SERVER_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? window.location.origin
        : (window.location.hostname.includes('vercel.app')
            ? 'https://buzzly-api.yourdomain.com' // <-- Set your Dokploy URL here
            : window.location.origin)
);
```

### Step 3: Deploy Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set **Framework Preset**: `Other / Static Site`.
3. Set **Root Directory**: `./frontend`.
4. Click **Deploy**.

---

## 🔒 Privacy & Security

- **Zero Data Persistence** — No chat histories or messages are stored in any database.
- **Anonymous Sessions** — Temporary random display names assigned on connection.
- **Transient Memory** — In-memory JavaScript `Map` / `Set` pairing cleanup on disconnect.

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">
  <b>Built with ❤️ by Manas Dey</b>
</div>
