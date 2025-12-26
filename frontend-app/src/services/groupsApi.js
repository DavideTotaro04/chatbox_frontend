import { api } from "./apiClient";

export async function listPublicGroups() {
    const r = await api.get("/api/groups");
    return r.data;
}

export async function listMyGroups() {
    const r = await api.get("/api/groups/me");
    return r.data;
}

export async function createGroup({ name, isPublic = true }) {
    const r = await api.post("/api/groups", { name, isPublic });
    return r.data;
}

export async function joinGroup(groupId) {
    const r = await api.post(`/api/groups/${groupId}/join`);
    return r.data;
}

export async function leaveGroup(groupId) {
    const r = await api.post(`/api/groups/${groupId}/leave`);
    return r.data;
}
