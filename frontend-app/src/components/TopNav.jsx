import React from "react";
import "../styles/TopNav.css";
import useAuth from "../context/useAuth";


export default function TopNav({ title, onToggleSidebar }) {
    const { user } = useAuth();

    return (
        <div className="topnav">
            <button className="iconBtn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                ☰
            </button>

            <div className="topnavTitle">{title}</div>

            <div className="topnavRight">
                <span className="topnavUser">{user?.email}</span>
            </div>
        </div>
    );
}
