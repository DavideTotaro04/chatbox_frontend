import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as groupsApi from "../services/groupsApi";
import "../styles/page.css";

export default function Groups() {
    const { setMyGroups } = useOutletContext(); // per aggiornare i gruppi nella sidebar

    const [publicGroups, setPublicGroups] = useState([]);   // tutti i gruppi pubblici
    const [myGroups, setMyGroupsLocal] = useState([]);  // i miei gruppi

    // stati per il form di creazione
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    // funzione per caricare i gruppi
    const load = async () => {
        setErr("");
        setOk("");

        const pub = await groupsApi.listPublicGroups(); // tutti i gruppi pubblici
        setPublicGroups(pub);

        const mine = await groupsApi.listMyGroups();        // i miei gruppi
        setMyGroupsLocal(mine);   // per filtrare
        setMyGroups(mine);        // per la sidebar
    };

    // carica i gruppi al montaggio
    useEffect(() => {
        load().catch((e) => setErr(e?.response?.data?.message || "Errore"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // calcola i gruppi pubblici visibili (escludendo i miei)
    const myGroupIds = useMemo(
        () => new Set((myGroups || []).map((g) => String(g._id))),
        [myGroups]
    );

    // filtra i gruppi pubblici per escludere quelli di cui sono già membro
    const visiblePublicGroups = useMemo(
        () => (publicGroups || []).filter((g) => !myGroupIds.has(String(g._id))),
        [publicGroups, myGroupIds]
    );

    // gestisce la creazione di un gruppo
    const onCreate = async (e) => {
        e.preventDefault();
        setErr("");
        setOk("");
        try {
            await groupsApi.createGroup({ name, isPublic });
            setName("");
            setOk("Gruppo creato");
            await load();
        } catch (e2) {
            setErr(e2?.response?.data?.message || "Errore creazione");
        }
    };

    // gestisce l'iscrizione a un gruppo pubblico
    const onJoin = async (id) => {
        setErr("");
        setOk("");
        try {
            await groupsApi.joinGroup(id);
            setOk("Iscritto al gruppo");
            await load();
        } catch (e2) {
            setErr(e2?.response?.data?.message || "Errore join");
        }
    };

    return (
        <div className="page">
            <h1 className="h1">Gruppi</h1>

            <div className="grid2">
                <div className="card">
                    <h2 className="h2">Crea gruppo</h2>
                    <form className="form" onSubmit={onCreate}>
                        <label className="label">
                            Nome
                            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                        </label>

                        <label className="label inline">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                            Pubblico
                        </label>

                        <button className="bottone btnCreaGruppo" type="submit">
                            Crea
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h2 className="h2">Gruppi pubblici</h2>

                    {err ? <div className="error">{err}</div> : null}
                    {ok ? <div className="ok">{ok}</div> : null}

                    <div className="list">
                        {visiblePublicGroups?.length ? (
                            visiblePublicGroups.map((g) => (
                                <div key={g._id} className="listRow">
                                    <div>
                                        <div className="strong">{g.name}</div>
                                        <div className="muted small">
                                            creato da {g.owner?.username || "sconosciuto"}
                                        </div>
                                    </div>
                                    <button className="bottone btnUnisciti" onClick={() => onJoin(g._id)}>
                                        Unisciti
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="muted">Nessun gruppo pubblico disponibile</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
