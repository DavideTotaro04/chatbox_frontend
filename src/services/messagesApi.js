import { api } from "./apiClient";

// Funzioni per le chiamate API di gestione dei messaggi
export async function getGroupMessages(groupId, { limit = 30, cursor } = {}) {
    const params = new URLSearchParams();   // crea parametri di query
    params.set("limit", String(limit)); // imposta limite
    if (cursor) params.set("cursor", cursor);   // imposta cursore

    const r = await api.get(`/api/messages/group/${groupId}?${params.toString()}`); // richiama API con parametri
    return r.data;  // ritorna i dati
}

// invia un nuovo messaggio a un gruppo
export async function deleteMessage(messageId) {
    const r = await api.delete(`/api/messages/${messageId}`);
    return r.data;
}
