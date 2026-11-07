import { apiFetch, parse } from "./auth.js";

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const conversation = (id) => `/conversations/${encodeURIComponent(id)}`;

export async function listConversations() {
  return parse(await apiFetch("/conversations"));
}

export async function getConversation(id) {
  return parse(await apiFetch(conversation(id)));
}

export async function getCircle() {
  return parse(await apiFetch("/conversations/circle"));
}

export async function searchCircle(query, limit = 20) {
  const params = new URLSearchParams({ q: query, scope: "circle", limit: String(limit) });
  return parse(await apiFetch(`/users/search?${params}`));
}

export async function createConversation({ type, memberIds, title = null }) {
  return parse(await apiFetch("/conversations", json("POST", { type, member_ids: memberIds, title })));
}

export async function listMessages(id, { before = null, limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), ...(before && { before }) });
  return parse(await apiFetch(`${conversation(id)}/messages?${params}`));
}

export async function sendMessage(id, message) {
  return parse(await apiFetch(`${conversation(id)}/messages`, json("POST", message)));
}

export async function markRead(id) {
  return parse(await apiFetch(`${conversation(id)}/read`, { method: "POST" }));
}

export async function markDelivered(id) {
  return parse(await apiFetch(`${conversation(id)}/delivered`, { method: "POST" }));
}

export async function updateConversation(id, changes) {
  return parse(await apiFetch(conversation(id), json("PATCH", changes)));
}

export async function leaveConversation(id) {
  return parse(await apiFetch(conversation(id), { method: "DELETE" }));
}

export async function voteMessage(id, vote) {
  return parse(await apiFetch(`/messages/${encodeURIComponent(id)}/vote`, json("POST", { vote })));
}

export async function deleteMessage(id) {
  return parse(await apiFetch(`/messages/${encodeURIComponent(id)}`, { method: "DELETE" }));
}
