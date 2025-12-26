import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { createSocket } from "../services/socketClient";
import "../styles/page.css";

function makeClientId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ChatRoom() {
    const { roomType, roomId } = useParams();

    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const socketRef = useRef(null);

    const room = useMemo(() => ({ roomType, roomId }), [roomType, roomId]);

    useEffect(() => {
        const socket = createSocket();
        socketRef.current = socket;

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        const onNewMessage = (m) => {
            // assicura key stabile: se manca _id, genera un clientId una volta
            const msg = m && typeof m === "object" ? m : { text: String(m) };
            if (!msg._id && !msg.clientId) msg.clientId = makeClientId();

            setMessages((prev) => [...prev, msg]);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("message:new", onNewMessage);

        socket.emit("room:join", room);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("message:new", onNewMessage);

            // se vuoi socket singleton per tutta l'app, NON fare disconnect qui
            // se invece vuoi 1 socket per pagina chat, lascia disconnect:
            socket.disconnect();
        };
    }, [room]);

    const send = (e) => {
        e.preventDefault();

        const socket = socketRef.current;
        const trimmed = text.trim();
        if (!socket || !trimmed) return;

        const tempId = makeClientId();
        const payload = { ...room, type: "text", text: trimmed, tempId };

        socket.emit("message:send", payload, (ack) => {
            if (!ack?.ok) {
                // opzionale: mostra errore
            }
        });

        setText("");
    };

    return (
        <div className="page">
            <div className="rowBetween">
                <h1 className="h1">Chat</h1>
                <div className="muted small">{connected ? "online" : "offline"}</div>
            </div>

            <div className="chatBox">
                {messages.length ? (
                    messages.map((m) => (
                        <div key={m._id || m.tempId || m.clientId} className="chatMsg">
                            <div className="chatMeta">
                                <span className="muted small">
                                    {m?.sender?.username || m?.sender?.email || m?.sender?._id || m?.sender || "unknown"}
                                </span>
                                <span className="muted small">
    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
  </span>
                            </div>

                            <div className="chatText">{m.text}</div>
                        </div>
                    ))
                ) : (
                    <div className="muted">Nessun messaggio</div>
                )}
            </div>

            <form className="chatForm" onSubmit={send}>
                <input
                    className="input"
                    placeholder="Scrivi..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button className="btn btnPrimary" type="submit">
                    Invia
                </button>
            </form>
        </div>
    );
}
