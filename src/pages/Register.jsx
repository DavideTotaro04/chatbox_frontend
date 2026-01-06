import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import "../styles/page.css";

export default function Register() {

    //dati di registrazione
    const { register } = useAuth(); // passiamo register da useAuth
    const nav = useNavigate();  // navigazione dopo registrazione
    // dati di registrazione
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    //funzione di submit (quando tocchi crea account)
    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        try {
            await register({ email, username, password }); // chiamiamo register
            nav("/app/dashboard");
        } catch (e2) {
            const msg = e2?.response?.data?.message || "Errore registrazione";
            setErr(msg);
        }
    };

    return (
        <div className="pageCenter">
            <div className="card">
                <h1 className="h1">Registrazione</h1>

                <form onSubmit={onSubmit} className="form">
                    <label className="label">
                        Email
                        <input
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>

                    <label className="label">
                        Username (3-20, lettere/numeri/_)
                        <input
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </label>

                    <label className="label">
                        Password (min 8)
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    {err ? <div className="error">{err}</div> : null}

                    <button className="bottone btnCreaAccount" type="submit">
                        Crea account
                    </button>
                </form>

                <div className="Login">
                    Hai già un account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}
