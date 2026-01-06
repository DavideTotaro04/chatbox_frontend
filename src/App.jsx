import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AppLayout from "./pages/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Groups from "./pages/Groups.jsx";
import ChatRoom from "./pages/ChatRoom.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
    return (
        //Definisce le rotte principali dell'applicazione
        <Routes>

            <Route path="/" element={<Landing />} />    {/* Pagina iniziale */}
            <Route path="/login" element={<Login />} /> {/* login */}
            <Route path="/register" element={<Register />} />   {/* registrazione */}

            {/* Area protetta dell'app */}
            <Route
                path="/app"
                element={
                    <ProtectedRoute>
                        <AppLayout />{/* Layout comune dell’app (TopNav, Sidebar, Outlet) */}
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} /> {/* /app → reindirizza automaticamente a /app/dashboard */}
                <Route path="dashboard" element={<Dashboard />} /> {/* Dashboard principale */}
                <Route path="groups" element={<Groups />} /> {/* Lista gruppi */}
                <Route path="chat/:roomType/:roomId" element={<ChatRoom />} />{/* Chat di un gruppo o stanza roomType e roomId arrivano dall’URL */}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} /> {/* Qualsiasi rotta non valida → torna alla landing */}
        </Routes>

    );
}

