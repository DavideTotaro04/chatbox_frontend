import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";

// componente per proteggere le rotte che richiedono autenticazione
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();    // ottieni lo stato di autenticazione
    if (loading) return null;   // mostra nulla mentre si carica lo stato di autenticazione
    if (!user) return <Navigate to="/login" replace />; // se non autenticato, reindirizza al login
    return children;
}
