import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentAuthedUserId: string | null = null;

export function getSocket(): Socket {
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

  if (!socket && typeof window !== 'undefined') {
    socket = io(backendUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  if (socket && typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (userId && (userId !== currentAuthedUserId || !socket.connected)) {
      currentAuthedUserId = userId;
      socket.auth = { userId, token };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else if (!socket.connected && token) {
      socket.auth = { userId, token };
      socket.connect();
    }
  }

  return socket as Socket;
}

export default socket;
