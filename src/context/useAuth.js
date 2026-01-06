import { useContext } from "react";
import AuthContext from "./AuthContext";

// custom hook per usare il contesto di autenticazione
export default function useAuth() {
    return useContext(AuthContext);
}
