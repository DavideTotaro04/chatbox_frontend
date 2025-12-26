import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import Sidebar from "../components/Sidebar.jsx";
import useAuth from "../context/useAuth";
import * as groupsApi from "../services/groupsApi";
import "../styles/layout.css";

function titleFromPath(pathname) {
    if (pathname.includes("/app/groups")) return "Gruppi";
    if (pathname.includes("/app/chat")) return "Chat";
    return "Home";
}

export default function AppLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [myGroups, setMyGroups] = useState([]);
    const [err, setErr] = useState("");
    const loc = useLocation();
    const nav = useNavigate();

    const title = useMemo(() => titleFromPath(loc.pathname), [loc.pathname]);

    useEffect(() => {
        let alive = true;
        (async () => {
            setErr("");
            try {
                const data = await groupsApi.listMyGroups();
                if (alive) setMyGroups(data);
            } catch (e) {
                if (alive) setErr(e?.response?.data?.message || "Errore caricamento gruppi");
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const onNavigate = (to) => {
        nav(to);
        setSidebarOpen(false);
    };

    const onLogout = async () => {
        await logout();
        nav("/");
    };

    return (
        <div className="appShell">
            <TopNav title={title} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

            <div className="appBody">
                <Sidebar
                    open={sidebarOpen}
                    userEmail={user?.email}
                    groups={myGroups}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                />

                <main className="appMain" onClick={() => sidebarOpen && setSidebarOpen(false)}>
                    {err ? <div className="errorBanner">{err}</div> : null}
                    <Outlet context={{ myGroups, setMyGroups }} />
                </main>
            </div>
        </div>
    );
}
