import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentAuthedUserId: string | null = null;

export function getSocket(): Socket {
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  if (!socket && typeof window !== 'undefined') {
    socket = io(backendUrl, {
      autoConnect: false,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      timeout: 6000,
    });

    socket.on('connect_error', (err) => {
      // Gracefully log without unhandled exception - telemetry falls back to HTTP/client classifier
      console.debug('Socket connection deferred (backend offline or spinning up):', err.message);
    });
  }

  if (socket && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    let userId = localStorage.getItem('userId');

    if (!userId) {
      userId = localStorage.getItem('guest_session_id');
      if (!userId) {
        userId = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        localStorage.setItem('guest_session_id', userId);
      }
    }

    if (userId !== currentAuthedUserId || !socket.connected) {
      currentAuthedUserId = userId;
      socket.auth = { userId, token: token || undefined };
      if (socket.connected) {
        socket.disconnect();
      }
      try {
        socket.connect();
      } catch (e) {
        console.debug('Socket connect attempt deferred:', e);
      }
    }
  }

  return socket as Socket;
}

export default socket;
