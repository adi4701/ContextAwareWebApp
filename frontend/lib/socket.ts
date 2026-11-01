import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentAuthedUserId: string | null = null;

export function getSocket(): Socket {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  if (!socket && typeof window !== 'undefined') {
    socket = io(backendUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  if (socket && typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId');
    if (userId && userId !== currentAuthedUserId) {
      currentAuthedUserId = userId;
      socket.auth = { userId };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else if (!socket.connected) {
      if (userId) {
        socket.auth = { userId };
        currentAuthedUserId = userId;
      }
      socket.connect();
    }
  }

  return socket as Socket;
}

export default socket;
