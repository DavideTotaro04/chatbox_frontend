import React, { useCallback,useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSocket } from "../services/socketClient";
import * as messagesApi from "../services/messagesApi";
import * as groupsApi from "../services/groupsApi";
import "../styles/page.css";
import useAuth from "../context/useAuth";

//converte la data e l'ora per leggerlo nella chat
function formatMsgDateTime(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";

    // data + ora senza secondi
    return dt.toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// genera un clientId casuale lato client per i messaggi prima che esista un _id del server.
function makeClientId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// trova il createdAt più vecchio in un array di messaggi, serve per il bottone carica precedenti
function oldestCursor(msgs) {
    let oldest = null;
    for (const m of msgs) {
        const t = m?.createdAt ? Date.parse(m.createdAt) : NaN;
        if (!Number.isFinite(t)) continue;
        if (oldest === null || t < oldest) oldest = t;
    }
    return oldest ? new Date(oldest).toISOString() : null;
}
// normalizza messaggio in arrivo (da socket o API) per garantire campi minimi
function normalizeIncoming(m) {
    const msg = m && typeof m === "object" ? m : { text: String(m) };
    if (!msg._id && !msg.clientId) msg.clientId = makeClientId();
    return msg;
}
// componente principale chat room per gruppi
export default function ChatRoom() {

    const nav = useNavigate();  // per redirect dopo leave o delete
    const { roomId } = useParams(); // solo gruppi: roomId = groupId, letto dall'URL
    const roomType = "group";   // tipo gruppo che è fisso, ovvero group

    //stato connessione, messaggi
    const [connected, setConnected] = useState(false);  // stato connessione socket
    const [messages, setMessages] = useState([]);   // lista dei messaggi
    const [text, setText] = useState("");   // testo input

    // caricamento storico messaggi
    const [loadingHistory, setLoadingHistory] = useState(false);    // carica messaggi precedenti per bottone
    const [historyError, setHistoryError] = useState("");             // eventuale errore caricamento storico messaggi

    // aggiunta membro
    const [addEmail, setAddEmail] = useState("");   // email nuovo membro
    const [addErr, setAddErr] = useState("");   // errore aggiunta membro
    const [addOk, setAddOk] = useState(""); // successo aggiunta membro
    const [adding, setAdding] = useState(false);    // stato aggiunta membro, per disabilitare il bottone momentaneamente

    // selezione messaggi
    const [selectMode, setSelectMode] = useState(false);        // modalità selezione messaggi
    const [selected, setSelected] = useState(() => new Set());      // messaggi selezionati (set di _id)

    // socket
    const socketRef = useRef(null);     // riferimento socket
    const room = useMemo(() => ({ roomType, roomId }), [roomType, roomId]);     // oggetto room per socket emit

    // autenticazione e utente corrente
    const { user } = useAuth(); // utente loggato
    const myId = user?.id;  // mio id

    // gruppo
    const [group, setGroup] = useState(null);   // dati gruppo
    const isOwner = group?.owner && String(group.owner._id || group.owner) === String(myId);    // sono il creatore del gruppo?
    const [myRole, setMyRole] = useState(null); // "admin" | "member", i ruoli possibili nel gruppo
    const isAdmin = myRole === "admin";     // controlla se è admin

    // funzione forza riconnessione socket
    const ensureSocketConnected = useCallback(() => {
        const s = createSocket();       // aggiorna auth + reconnect
        socketRef.current = s;

        if (s.connected) {
            s.emit("room:join", room);
        }
    }, [room]);

    // carica mio ruolo nel gruppo
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const data = await groupsApi.getMyGroupRole(roomId);    // chiama API per ruolo
                if (alive) setMyRole(data?.role || null);   // setta il ruolo
            } catch {
                if (alive) setMyRole(null);
            }
        })();

        return () => { alive = false; };
    }, [roomId]);

    // reset selezione quando cambi gruppo
    useEffect(() => {
        setSelectMode(false);   // disabilita modalità selezione
        setSelected(new Set());     // reset selezionati
    }, [roomId]);

    // carica storico gruppo
    useEffect(() => {
        let alive = true;

        (async () => {
            setLoadingHistory(true);    // inizio caricamento
            setHistoryError("");
            try {
                const data = await messagesApi.getGroupMessages(roomId, { limit: 40 }); // fetch ultimi 40 messaggi
                const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // ordina dal più vecchio al più recente
                if (alive) setMessages(sorted.map(normalizeIncoming));  // normalizza e setta messaggi
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

    // socket: join + realtime
    useEffect(() => {
        const socket = createSocket();
        socketRef.current = socket;

        // on connect serve per iscriversi al canale che seleziono
        const onConnect = () => {
            setConnected(true);
            socket.emit("room:join", room);
        };

        // on disconnect serve per aggiornare stato connessione
        const onDisconnect = () => setConnected(false);

        // nuovo messaggio in arrivo
        const onNewMessage = (m) => {
            const msg = normalizeIncoming(m);
            setMessages((prev) => [...prev, msg]);
        };
        // errore connessione
        const onConnectError = (err) => {
            setConnected(false);
            console.log("socket connect_error:", err?.message || err);
        };

        // registra eventi
        socket.on("connect" , onConnect);    // quando si connette, join alla room
        socket.on("disconnect", onDisconnect);  // quando si disconnette, aggiorna stato
        socket.on("message:new", onNewMessage); // nuovo messaggio
        socket.on("connect_error", onConnectError); // errore connessione

        setConnected(socket.connected); // stato iniziale
        if (socket.connected) socket.emit("room:join", room);   // join se già connesso

        // pulizia eventi alla dismount
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("message:new", onNewMessage);
            socket.off("connect_error", onConnectError);
        };
    }, [room]);

    // carica dati gruppo
    useEffect(() => {
        let alive = true;

        // fetch gruppo
        (async () => {
            try {
                const g = await groupsApi.getGroup(roomId);
                if (alive) setGroup(g);     //alive per evitare setState su componente smontato
            } catch {
                if (alive) setGroup(null);
            }
        })();

        return () => { alive = false; };
    }, [roomId]);

    // reset messaggi di stato aggiunta membro dopo 3 secondi
    useEffect(() => {
        if (!addOk) return;

        const timer = setTimeout(() => {
            setAddOk("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [addOk]);

    // reset errori aggiunta membro dopo 3 secondi
    useEffect(() => {
        if (!addErr) return;

        const timer = setTimeout(() => {
            setAddErr("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [addErr]);

    // gestisci visibilità pagina e stato rete
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "visible") {
                ensureSocketConnected();
            }
        };

        // gestisci ritorno online
        const onOnline = () => {
            ensureSocketConnected();
        };

        document.addEventListener("visibilitychange", onVis);   // quando cambio tab
        window.addEventListener("online", onOnline);    // quando torno online

        return () => {
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("online", onOnline);
        };
    }, [ensureSocketConnected]);

    // funzione carica precedenti
    const loadOlder = async () => {
        if (loadingHistory) return;

        const cursor = oldestCursor(messages); // trova il più vecchio createdAt, che sarebbe la data di creazione
        if (!cursor) return;

        setLoadingHistory(true);
        setHistoryError("");

        // fetch messaggi precedenti
        try {
            const data = await messagesApi.getGroupMessages(roomId,{ limit: 40, cursor });  // usa cursor per paginazione, recupera 40 messaggi prima di quelli attuali

            const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // ordina dal più vecchio al più recente
            const normalized = sorted.map(normalizeIncoming);   // normalizza messaggi

            // unisci con messaggi esistenti, evita duplicati
            setMessages((prev) => {
                const existing = new Set(prev.map((x) => x._id).filter(Boolean));   // set di _id esistenti per controllo duplicati
                const toAdd = normalized.filter((x) => !x._id || !existing.has(x._id)); // filtra solo nuovi messaggi
                return [...toAdd, ...prev]; // unisci nuovi messaggi con esistenti
            });
        } catch (e) {
            setHistoryError(e?.response?.data?.message || "Errore caricamento messaggi precedenti");
        } finally {
            setLoadingHistory(false);
        }
    };

    // funzione invia messaggio
    const send = (e) => {
        e.preventDefault(); // previene reload pagina

        // invia messaggio tramite socket
        const socket = socketRef.current;   // prendi la socket dal ref "vedere meglio"
        const trimmed = text.trim();    // trim del testo, ovvero rimuoviamo gli spazi vuoti
        if (!trimmed) return;

        // se socket non esiste, forza riconnessione
        if (!socket) {
            ensureSocketConnected();
            return;
        }

        // non inviare se socket non esiste o il testo è vuoto
        if (!socket.connected) {                // se non connesso, forza riconnessione e invia
            ensureSocketConnected();
            return;
        }

        const tempId = makeClientId();
        socket.emit("message:send", { ...room, type: "text", text: trimmed, tempId });  // invia messaggio
        setText("");
    };

    // funzione aggiungi membro
    const addMember = async () => {
        setAddErr("");
        setAddOk("");

        const email = addEmail.trim();  // trim email
        if (!email) return;

        // chiamata API per aggiungere il nuovo membro
        try {
            setAdding(true);
            const data = await groupsApi.addMemberByEmail(roomId, email);   // chiama API, passa roomId (groupId) ed email
            setAddOk(data?.message || "Utente aggiunto");
            setAddEmail("");
        } catch (e) {
            setAddErr(e?.response?.data?.message || "Errore aggiunta membro");
        } finally {
            setAdding(false);
        }
    };

    // funzione toggle selezione messaggio
    const toggleSelect = (id) => {
        // aggiorna set di selezionati
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);  // se già selezionato, deseleziona
            else next.add(id);  // altrimenti seleziona
            return next;
        });
    };
    // funzione cancella selezione
    const clearSelection = () => {
        setSelected(new Set());
        setSelectMode(false);
    };

    // controlla se posso selezionare il messaggio (se sono admin o se è mio)
    const canSelect = (m) => {
        if (isAdmin) return true;       // controlla se è admin
        const senderId = typeof m?.sender === "string" ? m.sender : m?.sender?._id || m?.sender?.id; // controlla se è mio messaggio
        return myId && senderId && String(senderId) === String(myId);   // confronta gli id come stringhe per evitare problemi di tipo
    };

    // funzione elimina selezionati
    const deleteSelected = async () => {
        const ids = Array.from(selected);   // converte set in array
        if (!ids.length) return;

        // elimina messaggi uno per uno
        for (const id of ids) {
            try {
                await messagesApi.deleteMessage(id);    // elimina messaggio con API deleteMessage
                setMessages((prev) => prev.filter((m) => m._id !== id));    // rimuovi messaggio dallo stato locale
            } catch {
                console.log(`Errore eliminazione messaggio ${id}`); // log errore
            }
        }
        clearSelection();   // toglie la selezione dai mess dopo eliminazione
    };

    // funzione abbandona gruppo
    const leaveGroup = async () => {
        const ok = window.confirm("Vuoi davvero abbandonare il gruppo?");
        if (!ok) return;

        try {
            await groupsApi.leaveGroup(roomId);
            nav("/app/groups");
        } catch {
            console.log("Errore abbandono gruppo");
        }
    };



    // render delle componenti
    return (
        <div className="page" >

        {/* HEADER COMANDI */}
            <div className="rowBetween">
                <h1 className="h1">{group?.name}</h1>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!selectMode ? (
                        <button
                            className="bottone btnSelezionaMess"
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
                            <div className="muted small">{selected.size} selezionati </div>
                            <button className="bottone btnEliminaMess" type="button" onClick={deleteSelected}>
                                Elimina
                            </button>
                            <button className="bottone btnAnnulla" type="button" onClick={clearSelection}>
                                Annulla
                            </button>
                        </>
                    )}

                    {isOwner ? (
                        <button
                            className="bottone btnEliminaGruppo"
                            type="button"
                            onClick={async () => {
                                const ok = window.confirm(
                                    "Sei sicuro di voler eliminare il gruppo?\nTutti i messaggi verranno eliminati."
                                );
                                if (!ok) return;

                                await groupsApi.deleteGroup(roomId);
                                nav("/app/groups");
                            }}

                        >
                            Elimina gruppo
                        </button>
                    ) : null}

                    <button className="bottone btnAbbandona" type="button" onClick={leaveGroup}>
                        Abbandona
                    </button>

                    <div className={`${connected ? "statusOnline" : "statusOffline"} small`}>
                        {connected ? "online" : "offline"}
                    </div>

                </div>
            </div>

            {/* STORICO MESSAGGI */}
            <div className="row" style={{ marginBottom: 10 }}>
                <button className="bottone btnCaricaPrecedenti" type="button" onClick={loadOlder} disabled={loadingHistory}>
                    {loadingHistory ? "Carico..." : "Carica precedenti"}
                </button>
                {historyError ? <div className="error">{historyError}</div> : null}
            </div>

            {/* AGGIUNGI MEMBRO */}

            <div className="rowBetween" style={{ gap: 10, marginBottom: 10 }}>
                {isAdmin ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                        <input
                        className="input"
                        placeholder="Email utente da aggiungere"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        />

                        <button className="bottone btnAggiungi" type="button" onClick={addMember} disabled={adding}>
                            {adding ? "Aggiungo..." : "Aggiungi"}
                        </button>
                    </div>
                ): null}

                <div style={{ minWidth: 220 }}>
                    {addErr ? <div className="error">{addErr}</div> : null}
                    {addOk ? <div className="ok small">{addOk}</div> : null}
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
                                <span className="emailUtente small">
                                  {m?.sender?.username || m?.sender?.email || m?.sender?._id || m?.sender || "unknown"}
                                </span>

                                <span className="muted small">
                                    {formatMsgDateTime(m.createdAt)}
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
                    onFocus={ensureSocketConnected}
                />
                <button className="bottone btnInvio" type="submit">
                    Invia
                </button>
            </form>
        </div>
    );
}
