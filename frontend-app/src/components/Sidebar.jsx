import React from "react";
import "../styles/Sidebar.css";

export default function Sidebar({ open, userEmail, groups, onNavigate, onLogout }) {
    return (
        <aside className={`sidebar ${open ? "open" : ""}`}>
            <div className="sidebarSection">
                <div className="sidebarLabel">Profilo</div>
                <div className="sidebarValue">{userEmail}</div>
                <button className="btn btnGhost" onClick={onLogout}>
                    Logout
                </button>
            </div>

            <div className="sidebarSection">
                <div className="sidebarLabel">Gruppi</div>

                <div className="sidebarList">
                    {groups?.length ? (
                        groups.map((g) => (
                            <button
                                key={g._id}
                                className="sidebarItem"
                                onClick={() => onNavigate(`/app/chat/group/${g._id}`)}
                            >
                                {g.name}
                            </button>
                        ))
                    ) : (
                        <div className="muted">Nessun gruppo</div>
                    )}
                </div>

                <button className="btn btnPrimary" onClick={() => onNavigate("/app/groups")}>
                    Gestisci gruppi
                </button>
            </div>
        </aside>
    );
}
