import { api } from "./apiClient";

export async function login({ email, password }) {
    const r = await api.post("/auth/login", { email, password });
    return r.data;
}

export async function register({ email, username, password }) {
    const r = await api.post("/auth/register", { email, username, password });
    return r.data;
}

export async function refresh({ refreshToken }) {
    const r = await api.post("/auth/refresh", { refreshToken });
    return r.data;
}

export async function logout({ refreshToken }) {
    const r = await api.post("/auth/logout", { refreshToken });
    return r.data;
}
