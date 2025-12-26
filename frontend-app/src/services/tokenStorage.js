const KEY = "auth_tokens_v1";

export function setTokens({ accessToken, refreshToken }) {
    sessionStorage.setItem(KEY, JSON.stringify({ accessToken, refreshToken }));
}

export function getTokens() {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

export function clearTokens() {
    sessionStorage.removeItem(KEY);
}
