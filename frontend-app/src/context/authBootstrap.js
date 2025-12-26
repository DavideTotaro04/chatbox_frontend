import { clearTokens, getTokens } from "../services/tokenStorage";

export function loadInitialUser() {
    const t = getTokens();
    const rawUser = sessionStorage.getItem("user");

    if (!t?.accessToken || !rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch {
        clearTokens();
        sessionStorage.removeItem("user");
        return null;
    }
}
