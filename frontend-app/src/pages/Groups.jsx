import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as groupsApi from "../services/groupsApi";
import "../styles/page.css";

export default function Groups() {
    const { setMyGroups } = useOutletContext();
    const [publicGroups, setPublicGroups] = useState([]);
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    const load = async () => {
        setErr("");
        setOk("");
        const pub = await groupsApi.listPublicGroups();
        setPublicGroups(pub);
        const mine = await groupsApi.listMyGroups();
        setMyGroups(mine);
    };

    useEffect(() => {
        load().catch((e) => setErr(e?.response?.data?.message || "Errore"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

                        <button className="btn btnPrimary" type="submit">
                            Crea
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h2 className="h2">Gruppi pubblici</h2>

                    {err ? <div className="error">{err}</div> : null}
                    {ok ? <div className="ok">{ok}</div> : null}

                    <div className="list">
                        {publicGroups?.length ? (
                            publicGroups.map((g) => (
                                <div key={g._id} className="listRow">
                                    <div>
                                        <div className="strong">{g.name}</div>
                                        <div className="muted small">{g._id}</div>
                                    </div>
                                    <button className="btn btnGhost" onClick={() => onJoin(g._id)}>
                                        Unisciti
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="muted">Nessun gruppo</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
