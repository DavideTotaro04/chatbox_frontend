import React from "react";
import { Link } from "react-router-dom";
import "../styles/page.css";

export default function Landing() {
    return (
        <div className="pageCenter">
            <div className="card">
                <h1 className="h1">ChatBox</h1>
                <p className="p">
                    Benvenuto in ChatBox, piattaforma di messaggistica istantanea che ti permette di
                    comunicare facilmente con i tuoi amici e colleghi.
                </p>

                <div className="row">
                    <Link className="btn btnPrimary" to="/login">
                        Accedi
                    </Link>
                    <Link className="btn btnGhost" to="/register">
                        Registrati
                    </Link>
                </div>
            </div>
        </div>
    );
}
