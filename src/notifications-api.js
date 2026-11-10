import { apiFetch, parse } from "./auth.js";

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function listNotifications({ cursor = null, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), ...(cursor && { cursor }) });
  return parse(await apiFetch(`/notifications?${params}`));
}

export async function getUnreadCount() {
  return parse(await apiFetch("/notifications/unread-count"));
}

export async function markNotificationsRead(ids) {
  return parse(await apiFetch("/notifications/read", json("POST", ids ? { ids } : { all: true })));
}

export async function getNotificationSettings() {
  return parse(await apiFetch("/users/me/notification-settings"));
}

export async function updateNotificationSettings(changes) {
  return parse(await apiFetch("/users/me/notification-settings", json("PATCH", changes)));
}

export async function getStreak() {
  return parse(await apiFetch("/users/me/streak"));
}

export async function updateTimezone(timezone) {
  return parse(await apiFetch("/users/me", json("PATCH", { timezone })));
}

export async function registerDevice({ platform, token, appVersion = null }) {
  return parse(await apiFetch("/devices", json("POST", { platform, token, app_version: appVersion })));
}

export async function unregisterDevice(token) {
  return parse(await apiFetch(`/devices/${encodeURIComponent(token)}`, { method: "DELETE" }));
}
