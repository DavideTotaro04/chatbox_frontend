import React, { createContext, useMemo, useState } from "react";
import * as authApi from "../services/authApi";
import { setTokens, clearTokens, getTokens } from "../services/tokenStorage";
import { loadInitialUser } from "./authBootstrap";

const AuthContext = createContext(null);
export default AuthContext;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadInitialUser);
    const [loading] = useState(false);

    const login = async ({ email, password }) => {
        const data = await authApi.login({ email, password });
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const register = async ({ email, password, username}) => {
        const data = await authApi.register({ email, password, username });
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const logout = async () => {
        const t = getTokens();
        try {
            if (t?.refreshToken) {
                await authApi.logout({ refreshToken: t.refreshToken });
            }
        } catch {
            // ignore
        }

        clearTokens();
        sessionStorage.removeItem("user");
        setUser(null);
    };

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
