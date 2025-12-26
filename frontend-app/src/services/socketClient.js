import { io } from "socket.io-client";
import { getTokens } from "./tokenStorage";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export function createSocket() {
    const t = getTokens();
    return io(SOCKET_URL, {
        autoConnect: true,
        auth: {
            token: t?.accessToken ? `Bearer ${t.accessToken}` : undefined,
        },
    });
}
