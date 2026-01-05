import axios from "axios";
import { getTokens, setTokens, clearTokens } from "./tokenStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
    baseURL: API_URL,
});

// attach access token
api.interceptors.request.use((config) => {
    const t = getTokens();
    if (t?.accessToken) config.headers.Authorization = `Bearer ${t.accessToken}`;
    return config;
});

let refreshingPromise = null;

// refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        const status = err?.response?.status;

        if (status !== 401 || original?._retry) throw err;

        original._retry = true;

        const t = getTokens();
        if (!t?.refreshToken) {
            clearTokens();
            throw err;
        }

        if (!refreshingPromise) {
            refreshingPromise = axios
                .post(`${API_URL}/auth/refresh`, { refreshToken: t.refreshToken })
                .then((r) => r.data)
                .finally(() => {
                    refreshingPromise = null;
                });
        }

        const data = await refreshingPromise;
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(original);
    }
);
