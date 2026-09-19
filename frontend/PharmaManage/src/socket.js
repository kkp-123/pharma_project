import { io } from "socket.io-client";

const socketport = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000"; // your backend port

// 🔥 connect to backend
const socket = io(`${socketport}`); // your backend port

export default socket;