import React, { createContext, useMemo, useState } from "react";
import * as authApi from "../services/authApi";
import { setTokens, clearAuthStorage, setUser} from "../services/tokenStorage";
import { loadInitialUser } from "./authBootstrap";
import { refreshSocketAuth, disconnectSocket } from "../services/socketClient";

// crea il contesto di autenticazione
const AuthContext = createContext(null);
export default AuthContext;

// fornisce il provider di autenticazione
export function AuthProvider({ children }) {
    const [user, setUserState] = useState(loadInitialUser); // carica l’utente iniziale dallo storage
    const [loading] = useState(false);  // stato di caricamento (non usato in questo esempio)

    // funzione di login
    const login = async ({ email, password }) => {
        const data = await authApi.login({ email, password });  // chiama l’API di login

        // salva i token e i dati utente nello storage
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUser(data.user);

        // aggiorna l’autenticazione del socket
        refreshSocketAuth(data.accessToken);
        setUserState(data.user);
    };

    // funzione di registrazione
    const register = async ({ email, password, username }) => {
        const data = await authApi.register({ email, password, username }); // chiama l’API di registrazione

        // salva i token e i dati utente nello storage
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUser(data.user);

        // aggiorna l’autenticazione del socket
        refreshSocketAuth(data.accessToken);
        setUserState(data.user);
    };

    // funzione di logout
    const logout = () => {
        clearAuthStorage(); // pulisce lo storage di autenticazione
        disconnectSocket(); // disconnette il socket
        setUserState(null);
    };

    // memorizza il valore del contesto per ottimizzare le prestazioni
    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading]
    );

    // fornisce il contesto ai componenti figli
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
