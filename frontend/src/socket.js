import { io } from "socket.io-client";

// Dynamically use the current browser hostname so it works from
// any device on the local network (PC: localhost, Phone: 192.168.x.x)
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `http://${window.location.hostname}:3001`;

const socket = io(BACKEND_URL, {
  autoConnect: false,
});

export default socket;
