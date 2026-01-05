const TOKENS_KEY = "auth_tokens_v1";
const USER_KEY = "auth_user_v1";

/* =========================
   TOKENS
========================= */
export function setTokens({ accessToken, refreshToken }) {
    sessionStorage.setItem(
        TOKENS_KEY,
        JSON.stringify({ accessToken, refreshToken })
    );
}

export function getTokens() {
    const raw = sessionStorage.getItem(TOKENS_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        // hardening minimale
        if (!parsed?.accessToken || !parsed?.refreshToken) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearTokens() {
    sessionStorage.removeItem(TOKENS_KEY);
}

/* =========================
   USER
========================= */
export function setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function clearUser() {
    sessionStorage.removeItem(USER_KEY);
}

/* =========================
   COMBINED
========================= */
export function clearAuthStorage() {
    clearTokens();
    clearUser();
}
