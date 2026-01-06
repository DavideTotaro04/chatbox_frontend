import { api } from "./apiClient";

// Funzioni per le chiamate API di gestione dei gruppi
export async function listPublicGroups() {
    const r = await api.get("/api/groups");
    return r.data;
}

// elenca i gruppi di cui l’utente è membro
export async function listMyGroups() {
    const r = await api.get("/api/groups/me");
    return r.data;
}

// crea un nuovo gruppo
export async function createGroup({ name, isPublic = true }) {
    const r = await api.post("/api/groups", { name, isPublic });
    return r.data;
}

// iscrive l’utente a un gruppo pubblico
export async function joinGroup(groupId) {
    const r = await api.post(`/api/groups/${groupId}/join`);
    return r.data;
}

// rimuove l’utente da un gruppo
export async function leaveGroup(groupId) {
    const r = await api.post(`/api/groups/${groupId}/leave`);
    return r.data;
}

// aggiunge un membro a un gruppo tramite email
export async function addMemberByEmail(groupId, email) {
    const r = await api.post(`/api/groups/${groupId}/members`, { email });
    return r.data; // { message, user }
}

// ottiene il ruolo dell’utente nel gruppo
export async function getMyGroupRole(groupId) {
    const r = await api.get(`/api/groups/${groupId}/me`);
    return r.data; // { role }
}

// ottiene i dettagli di un gruppo
export async function getGroup(id) {
    const r = await api.get(`/api/groups/${id}`);
    return r.data;
}

// elimina un gruppo (solo admin)
export async function deleteGroup(id) {
    const r = await api.delete(`/api/groups/${id}`);
    return r.data;
}

