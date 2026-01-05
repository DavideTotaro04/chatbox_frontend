import { api } from "./apiClient";

export async function getGroupMessages(groupId, { limit = 30, cursor } = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);

    const r = await api.get(`/api/messages/group/${groupId}?${params.toString()}`);
    return r.data;
}

export async function deleteMessage(messageId) {
    const r = await api.delete(`/api/messages/${messageId}`);
    return r.data;
}
