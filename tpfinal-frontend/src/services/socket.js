import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : import.meta.env.VITE_API_URL;

  export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});