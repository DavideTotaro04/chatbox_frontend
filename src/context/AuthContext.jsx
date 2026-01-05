import React, { createContext, useMemo, useState } from "react";
import * as authApi from "../services/authApi";
import {
    setTokens,
    clearAuthStorage,
    setUser,
} from "../services/tokenStorage";
import { loadInitialUser } from "./authBootstrap";
import { refreshSocketAuth, disconnectSocket } from "../services/socketClient";

const AuthContext = createContext(null);
export default AuthContext;

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(loadInitialUser);
    const [loading] = useState(false);

    const login = async ({ email, password }) => {
        const data = await authApi.login({ email, password });

        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUser(data.user);

        refreshSocketAuth(data.accessToken);
        setUserState(data.user);
    };

    const register = async ({ email, password, username }) => {
        const data = await authApi.register({ email, password, username });

        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUser(data.user);

        refreshSocketAuth(data.accessToken);
        setUserState(data.user);
    };

    const logout = () => {
        clearAuthStorage();
        disconnectSocket();
        setUserState(null);
    };

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
