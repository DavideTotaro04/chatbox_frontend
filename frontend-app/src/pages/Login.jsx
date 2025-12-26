import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import "../styles/page.css";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        try {
            await login({ email, password });
            nav("/app/dashboard");
        } catch (e2) {
            const msg = e2?.response?.data?.message || "Errore login";
            setErr(msg);
        }
    };

    return (
        <div className="pageCenter">
            <div className="card">
                <h1 className="h1">Login</h1>

                <form onSubmit={onSubmit} className="form">
                    <label className="label">
                        Email
                        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>

                    <label className="label">
                        Password
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    {err ? <div className="error">{err}</div> : null}

                    <button className="btn btnPrimary" type="submit">
                        Entra
                    </button>
                </form>

                <div className="muted">
                    Non hai un account? <Link to="/register">Registrati</Link>
                </div>
            </div>
        </div>
    );
}
