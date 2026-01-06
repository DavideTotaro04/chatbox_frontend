import { getTokens, getUser } from "../services/tokenStorage";

// funzione per caricare l’utente iniziale dallo storage
export function loadInitialUser() {
    const t = getTokens();  // ottiene i token di autenticazione
    const user = getUser(); // ottiene i dati utente

    if (!t?.accessToken || !user) return null;  // se mancano token o user, ritorna null

    // altrimenti ritorna i dati utente
    return user;
}
