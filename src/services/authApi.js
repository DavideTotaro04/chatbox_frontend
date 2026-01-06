import { api } from "./apiClient";

// Funzioni per le chiamate API di autenticazione
export async function login({ email, password }) {
    const r = await api.post("/auth/login", { email, password });
    return r.data;
}

// registra un nuovo utente
export async function register({ email, username, password }) {
    const r = await api.post("/auth/register", { email, username, password });
    return r.data;
}

// richiede il refresh del token di accesso
export async function refresh({ refreshToken }) {
    const r = await api.post("/auth/refresh", { refreshToken });
    return r.data;
}

// effettua il logout invalidando il token di refresh
export async function logout({ refreshToken }) {
    const r = await api.post("/auth/logout", { refreshToken });
    return r.data;
}
