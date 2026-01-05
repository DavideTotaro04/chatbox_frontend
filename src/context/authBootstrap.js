import { getTokens, getUser } from "../services/tokenStorage";

export function loadInitialUser() {
    const t = getTokens();
    const user = getUser();

    if (!t?.accessToken || !user) return null;

    // se token o user sono corrotti / incoerenti, pulizia totale
    return user;
}
