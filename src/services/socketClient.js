import { io } from "socket.io-client";
import { getTokens, setTokens, clearTokens } from "./tokenStorage";
import { refresh as refreshApi } from "./authApi";

// URL del server Socket.IO (da env o fallback locale)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// inizializza variabili
let socket = null;
let refreshingPromise = null;

// funzione per il refresh dei token
async function refreshTokens() {
    const t = getTokens();
    const refreshToken = t?.refreshToken;
    if (!refreshToken) return null; // nessun token di refresh disponibile

    if (refreshingPromise) return refreshingPromise;    // se già in corso, ritorna la promessa esistente

    // avvia il processo di refresh
    refreshingPromise = (async () => {
        try {
            const data = await refreshApi({ refreshToken });

            // estrae i nuovi token
            const newAccess = data?.accessToken;
            const newRefresh = data?.refreshToken || refreshToken;

            if (!newAccess) return null;

            // salva i nuovi token
            setTokens({ accessToken: newAccess, refreshToken: newRefresh });
            return { accessToken: newAccess, refreshToken: newRefresh };
        } catch {
            // refresh fallito: pulizia tokens
            clearTokens();
            return null;
        } finally {
            refreshingPromise = null;
        }
    })();

    return refreshingPromise;
}

// funzione per formattare il token Bearer
function bearer(token) {
    if (!token) return undefined;
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

// funzione per ottenere l’oggetto di autenticazione corrente
function currentAuth() {
    const t = getTokens();
    return { token: bearer(t?.accessToken) };
}

// crea o ritorna l’istanza Socket.IO
export function createSocket() {
    if (!socket) {  // crea nuova istanza
        socket = io(SOCKET_URL, {
            autoConnect: true,
            auth: currentAuth(),
        });

        // gestisce errori di connessione
        socket.on("connect_error", async (err) => {
            const msg = err?.message || "";

            if (!msg.toLowerCase().includes("auth token invalid")) return;  // non è un errore di autenticazione

            const refreshed = await refreshTokens();    // tenta il refresh dei token
            if (!refreshed?.accessToken) return;

            socket.auth = currentAuth();

            if (!socket.connected && !socket.connecting) {  // riconnetti se necessario
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

// funzione per aggiornare il token di autenticazione del socket
export function refreshSocketAuth(accessToken) {
    if (!socket) return;

    socket.auth = { token: bearer(accessToken) };   // aggiorna token

    // se è connesso, invia evento di refresh
    if (socket.connected) {
        socket.emit("auth:refresh", { token: bearer(accessToken) }, () => {});
        return;
    }
    if (!socket.connecting) socket.connect();   // riconnetti se necessario
}

// funzione per disconnettere il socket
export function disconnectSocket() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
}
