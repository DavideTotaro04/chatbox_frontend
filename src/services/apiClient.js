import axios from "axios";
import { getTokens, setTokens, clearTokens } from "./tokenStorage";

//URL base dell’API (da env o fallback locale)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Istanza axios centralizzata
export const api = axios.create({
    baseURL: API_URL,
});

// aggiunge token di accesso a ogni richiesta HTTP
api.interceptors.request.use((config) => {
    const t = getTokens();
    if (t?.accessToken) config.headers.Authorization = `Bearer ${t.accessToken}`;   // aggiunge header di autorizzazione
    return config;
});

let refreshingPromise = null;

// gestisce il refresh del token di accesso se scaduto
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;    // richiesta originale
        const status = err?.response?.status;   // stato della risposta

        if (status !== 401 || original?._retry) throw err;  // se non è 401 o è già stato ritentato: propaga errore

        original._retry = true; // evita loop infiniti

        const t = getTokens();  // token correnti
        if (!t?.refreshToken) {
            clearTokens();  // nessun token di refresh: logout
            throw err;
        }

        // se non c’è già un refresh in corso, lo avvia
        if (!refreshingPromise) {
            refreshingPromise = axios
                .post(`${API_URL}/auth/refresh`, { refreshToken: t.refreshToken })  // richiede nuovo token
                .then((r) => r.data)    // estrae i dati
                .finally(() => {    // al termine resetta la promessa
                    refreshingPromise = null;
                });
        }

        // attende il completamento del refresh
        const data = await refreshingPromise;
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });  // salva i nuovi token

        // ripete la richiesta originale con il nuovo token di accesso
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(original);
    }
);
