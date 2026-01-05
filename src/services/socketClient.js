import { io } from "socket.io-client";
import { getTokens, setTokens, clearTokens } from "./tokenStorage";
import { refresh as refreshApi } from "./authApi";


const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socket = null;

let refreshingPromise = null;

async function refreshTokens() {
    const t = getTokens();
    const refreshToken = t?.refreshToken;
    if (!refreshToken) return null;

    if (refreshingPromise) return refreshingPromise;

    refreshingPromise = (async () => {
        try {
            const data = await refreshApi({ refreshToken });

            const newAccess = data?.accessToken;
            const newRefresh = data?.refreshToken || refreshToken;

            if (!newAccess) return null;

            setTokens({ accessToken: newAccess, refreshToken: newRefresh });
            return { accessToken: newAccess, refreshToken: newRefresh };
        } catch {
            // refresh fallito: pulizia tokens
            clearTokens?.();
            return null;
        } finally {
            refreshingPromise = null;
        }
    })();

    return refreshingPromise;
}


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

        socket.on("connect_error", async (err) => {
            const msg = err?.message || "";

            if (!msg.toLowerCase().includes("auth token invalid")) return;

            const refreshed = await refreshTokens();
            if (!refreshed?.accessToken) return;

            socket.auth = currentAuth();

            if (!socket.connected && !socket.connecting) {
                socket.connect();
            }
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
