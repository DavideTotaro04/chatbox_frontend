import { io } from "socket.io-client";
import { getTokens } from "./tokenStorage";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socket = null;

function bearer(token) {
    if (!token) return undefined;
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function currentAuth() {
    const t = getTokens();
    return { token: bearer(t?.accessToken) };
}

export function createSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: true,
            auth: currentAuth(),
        });
    } else {
        // aggiorna auth a ogni chiamata (utile se token cambia)
        socket.auth = currentAuth();

        // se era stata disconnessa manualmente o per errori, riconnetti
        if (!socket.connected && !socket.connecting) {
            socket.connect();
        }
    }

    return socket;
}

export function refreshSocketAuth(accessToken) {
    if (!socket) return;

    socket.auth = { token: bearer(accessToken) };

    if (socket.connected) {
        socket.emit("auth:refresh", { token: bearer(accessToken) }, () => {});
        return;
    }

    if (!socket.connecting) socket.connect();
}

export function disconnectSocket() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
}
