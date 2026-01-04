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

export async function addMemberByEmail(groupId, email) {
    const r = await api.post(`/api/groups/${groupId}/members`, { email });
    return r.data; // { message, user }
}

export async function getMyGroupRole(groupId) {
    const r = await api.get(`/api/groups/${groupId}/me`);
    return r.data; // { role }
}

export async function getGroup(id) {
    const r = await api.get(`/api/groups/${id}`);
    return r.data;
}

export async function deleteGroup(id) {
    const r = await api.delete(`/api/groups/${id}`);
    return r.data;
}

