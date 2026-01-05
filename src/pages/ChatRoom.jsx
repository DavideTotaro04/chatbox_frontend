import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSocket } from "../services/socketClient";
import * as messagesApi from "../services/messagesApi";
import * as groupsApi from "../services/groupsApi";
import "../styles/page.css";
import useAuth from "../context/useAuth";




function makeClientId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function oldestCursor(msgs) {
    let oldest = null;
    for (const m of msgs) {
        const t = m?.createdAt ? Date.parse(m.createdAt) : NaN;
        if (!Number.isFinite(t)) continue;
        if (oldest === null || t < oldest) oldest = t;
    }
    return oldest ? new Date(oldest).toISOString() : null;
}


function normalizeIncoming(m) {
    const msg = m && typeof m === "object" ? m : { text: String(m) };
    if (!msg._id && !msg.clientId) msg.clientId = makeClientId();
    return msg;
}

export default function ChatRoom() {
    const nav = useNavigate();
    const { roomId } = useParams(); // ✅ solo gruppi: roomId = groupId
    const roomType = "group";

    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState("");

    const [addEmail, setAddEmail] = useState("");
    const [addErr, setAddErr] = useState("");
    const [addOk, setAddOk] = useState("");
    const [adding, setAdding] = useState(false);

    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState(() => new Set());

    const socketRef = useRef(null);
    const room = useMemo(() => ({ roomType, roomId }), [roomType, roomId]);

    const { user } = useAuth();
    const myId = user?.id;

    const [group, setGroup] = useState(null);

    const isOwner = group?.owner && String(group.owner._id || group.owner) === String(myId);

    const [myRole, setMyRole] = useState(null); // "admin" | "member"
    const isAdmin = myRole === "admin";





    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const data = await groupsApi.getMyGroupRole(roomId);
                if (alive) setMyRole(data?.role || null);
            } catch {
                if (alive) setMyRole(null);
            }
        })();

        return () => { alive = false; };
    }, [roomId]);

    // reset selezione quando cambi gruppo
    useEffect(() => {
        setSelectMode(false);
        setSelected(new Set());
    }, [roomId]);

    // 1) carica storico gruppo
    useEffect(() => {
        let alive = true;

        (async () => {
            setLoadingHistory(true);
            setHistoryError("");
            try {
                const data = await messagesApi.getGroupMessages(roomId, { limit: 40 });
                const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                if (alive) setMessages(sorted.map(normalizeIncoming));
            } catch (e) {
                if (alive) setHistoryError(e?.response?.data?.message || "Errore caricamento messaggi");
            } finally {
                if (alive) setLoadingHistory(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [roomId]);

    // 2) socket: join + realtime
    useEffect(() => {
        const socket = createSocket();
        socketRef.current = socket;

        const onConnect = () => {
            setConnected(true);
            socket.emit("room:join", room);
        };

        const onDisconnect = () => setConnected(false);

        const onNewMessage = (m) => {
            const msg = normalizeIncoming(m);
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("message:new", onNewMessage);

        // sync stato subito
        setConnected(socket.connected);
        if (socket.connected) socket.emit("room:join", room);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("message:new", onNewMessage);
        };
    }, [room]);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const g = await groupsApi.getGroup(roomId);
                if (alive) setGroup(g);
            } catch {
                if (alive) setGroup(null);
            }
        })();

        return () => { alive = false; };
    }, [roomId]);

    // 3) carica precedenti
    const loadOlder = async () => {
        if (loadingHistory) return;

        const cursor = oldestCursor(messages); // createdAt del più vecchio in UI
        if (!cursor) return;

        setLoadingHistory(true);
        setHistoryError("");

        try {
            const data = await messagesApi.getGroupMessages(roomId,{ limit: 40, cursor });

            const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const normalized = sorted.map(normalizeIncoming);

            setMessages((prev) => {
                const existing = new Set(prev.map((x) => x._id).filter(Boolean));
                const toAdd = normalized.filter((x) => !x._id || !existing.has(x._id));
                return [...toAdd, ...prev];
            });
        } catch (e) {
            setHistoryError(e?.response?.data?.message || "Errore caricamento precedenti");
        } finally {
            setLoadingHistory(false);
        }
    };


    const send = (e) => {
        e.preventDefault();

        const socket = socketRef.current;
        const trimmed = text.trim();
        if (!socket || !trimmed) return;
        if (!socket.connected) return;

        const tempId = makeClientId();
        socket.emit("message:send", { ...room, type: "text", text: trimmed, tempId });
        setText("");
    };

    const addMember = async () => {
        setAddErr("");
        setAddOk("");

        const email = addEmail.trim();
        if (!email) return;

        try {
            setAdding(true);
            const data = await groupsApi.addMemberByEmail(roomId, email);
            setAddOk(data?.message || "Utente aggiunto");
            setAddEmail("");
        } catch (e) {
            setAddErr(e?.response?.data?.message || "Errore aggiunta membro");
        } finally {
            setAdding(false);
        }
    };

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => {
        setSelected(new Set());
        setSelectMode(false);
    };

    const canSelect = (m) => {
        if (isAdmin) return true;

        const senderId =
            typeof m?.sender === "string" ? m.sender : m?.sender?._id || m?.sender?.id;

        return myId && senderId && String(senderId) === String(myId);
    };



    const deleteSelected = async () => {
        const ids = Array.from(selected);
        if (!ids.length) return;

        for (const id of ids) {
            try {
                await messagesApi.deleteMessage(id);
                setMessages((prev) => prev.filter((m) => m._id !== id));
            } catch {
                // opzionale: mostra errore
            }
        }
        clearSelection();
    };

    const leaveGroup = async () => {
        try {
            await groupsApi.leaveGroup(roomId);
            nav("/app/groups");
        } catch {
            // opzionale: mostra errore
        }
    };

    return (
        <div className="page">
            {/* HEADER COMANDI */}
            <div className="rowBetween">
                <h1 className="h1">{group?.name}</h1>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!selectMode ? (
                        <button
                            className="btn btnGhost"
                            type="button"
                            onClick={() => {
                                // filtra selezionati: tieni solo i miei
                                setSelected((prev) => {
                                    const next = new Set();
                                    for (const id of prev) {
                                        const msg = messages.find((x) => x._id === id);
                                        if (msg && canSelect(msg)) next.add(id);
                                    }
                                    return next;
                                });
                                setSelectMode(true);
                            }}
                        >

                        Seleziona
                        </button>
                    ) : (
                        <>
                            <div className="muted small">{selected.size} selezionati</div>
                            <button className="btn btnGhost" type="button" onClick={deleteSelected}>
                                Elimina
                            </button>
                            <button className="btn btnGhost" type="button" onClick={clearSelection}>
                                Annulla
                            </button>
                        </>
                    )}

                    {isOwner ? (
                        <button
                            className="btn btnGhost"
                            type="button"
                            onClick={async () => {
                                await groupsApi.deleteGroup(roomId);
                                nav("/app/groups");
                            }}
                        >
                            Elimina gruppo
                        </button>
                    ) : null}

                    <button className="btn btnGhost" type="button" onClick={leaveGroup}>
                        Abbandona
                    </button>

                    <div className="muted small">{connected ? "online" : "online"}</div>
                </div>
            </div>

            {/* HISTORY */}
            <div className="row" style={{ marginBottom: 10 }}>
                <button className="btn btnGhost" type="button" onClick={loadOlder} disabled={loadingHistory}>
                    {loadingHistory ? "Carico..." : "Carica precedenti"}
                </button>
                {historyError ? <div className="error">{historyError}</div> : null}
            </div>

            {/* ADD MEMBER */}

            <div className="rowBetween" style={{ gap: 10, marginBottom: 10 }}>
                {isAdmin ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                        <input
                        className="input"
                        placeholder="Email utente da aggiungere"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        />

                        <button className="btn btnGhost" type="button" onClick={addMember} disabled={adding}>
                            {adding ? "Aggiungo..." : "Aggiungi"}
                        </button>
                    </div>
                ): null}

                <div style={{ minWidth: 220 }}>
                    {addErr ? <div className="error">{addErr}</div> : null}
                    {addOk ? <div className="muted small">{addOk}</div> : null}
                </div>
            </div>

            {/* CHAT */}
            <div className="chatBox">
                {messages.length ? (
                    messages.map((m) => (
                        <div key={m._id || m.tempId || m.clientId} className="chatMsg">
                            {selectMode && m._id && canSelect(m) ? (
                                <input
                                    type="checkbox"
                                    checked={selected.has(m._id)}
                                    onChange={() => toggleSelect(m._id)}
                                    style={{ marginRight: 8 }}
                                />
                            ) : null}


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
                    <div className="muted">{loadingHistory ? "Carico..." : "Nessun messaggio"}</div>
                )}
            </div>

            {/* INPUT */}
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
