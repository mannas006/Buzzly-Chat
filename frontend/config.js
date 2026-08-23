// Environment Configuration for Buzzly Chat
// Set your Dokploy backend URL here when hosting frontend on Vercel.
// If empty or null, it defaults to window.location.origin (for single-server setups).

window.SOCKET_SERVER_URL = window.SOCKET_SERVER_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? window.location.origin
        : (window.location.hostname.includes('vercel.app')
            ? 'https://buzzly-backend.dokploy.app' // Update this to your Dokploy VPS domain
            : window.location.origin)
);
