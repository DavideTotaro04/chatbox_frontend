// dichiarazione variabili
const TOKENS_KEY = "auth_tokens_v1";
const USER_KEY = "auth_user_v1";

//TOKENS

// funzione per salvare
export function setTokens({ accessToken, refreshToken }) {
    sessionStorage.setItem(     // salva i token in sessionStorage
        TOKENS_KEY,
        JSON.stringify({ accessToken, refreshToken })   // converte in stringa JSON
    );
}

//funzione per ottenere i token di autenticazione
export function getTokens() {
    const raw = sessionStorage.getItem(TOKENS_KEY);     // legge i token da sessionStorage
    if (!raw) return null;

    // tenta di parsare la stringa JSON
    try {
        const parsed = JSON.parse(raw);
        // hardening minimale
        if (!parsed?.accessToken || !parsed?.refreshToken) return null; // controlla che entrambi i token siano presenti
        return parsed;
    } catch {
        return null;
    }
}

// funzione per cancellare i token di autenticazione
export function clearTokens() {
    sessionStorage.removeItem(TOKENS_KEY);  // rimuove i token da sessionStorage
}

//UTENTE

// funzione per salvare, ottenere e cancellare i dati utente
export function setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user)); // salva i dati utente in sessionStorage
}

// funzione per ottenere i dati utente
export function getUser() {
    const raw = sessionStorage.getItem(USER_KEY);   // legge i dati utente da sessionStorage
    if (!raw) return null;

    try {
        return JSON.parse(raw);     // tenta di parsare la stringa JSON
    } catch {
        return null;
    }
}

// funzione per cancellare i dati utente
export function clearUser() {
    sessionStorage.removeItem(USER_KEY);    // rimuove i dati utente da sessionStorage
}

// funzione per cancellare sia i token che i dati utente
export function clearAuthStorage() {
    clearTokens();  // cancella i token di autenticazione
    clearUser();    // cancella i dati utente
}
