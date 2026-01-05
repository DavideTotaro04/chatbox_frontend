import React from "react";
import { Link } from "react-router-dom";
import "../styles/page.css";

export default function Landing() {
    return (
        <div className="pageCenter">
            <div className="card">
                <h1 className="h1">ChatBox</h1>
                <p className="p">
                    App minimal per messaggi in tempo reale: registrazione/login, gruppi, chat.
                </p>

                <div className="row">
                    <Link className="btn btnPrimary" to="/login">
                        Login
                    </Link>
                    <Link className="btn btnGhost" to="/register">
                        Registrazione
                    </Link>
                </div>
            </div>
        </div>
    );
}
