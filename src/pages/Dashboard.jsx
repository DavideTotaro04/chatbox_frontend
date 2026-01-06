import React from "react";
import "../styles/page.css";

export default function Dashboard() {

    return (
        <div className="page">
            <h1 className="h1">CHATBOX</h1><br/>
            <p className="p muted"> Chatbox ti permette di comunicare in tempo reale tramite gruppi.</p>
            <p className="p muted"> Scegli un gruppo dalla barra laterale per entrare in chat. </p>
            <p className="p muted"> Oppure vai su “Gestisci gruppi” per crearne uno nuovo o unirti a quelli pubblici. </p>
            <p className="p muted"> Se un gruppo è privato, chiedi all’amministratore di aggiungerti usando la tua email di registrazione. </p>
        </div>
    );
}
