import { onSocketEvent } from "./messages-socket.js";
import * as api from "./notifications-api.js";

const PAGE_SIZE = 20;

const store = { unread: 0, items: [], cursor: null, done: false, loading: false, loaded: false, error: false };
const listeners = new Set();
let unsubscribeSocket = null;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(change) {
  listeners.forEach((listener) => listener(change));
}

export const unreadCount = () => store.unread;
export const notifications = () => store.items;
export const listState = () => ({ done: store.done, loading: store.loading, loaded: store.loaded, error: store.error });

function setUnread(unread) {
  store.unread = unread;
  notify({ type: "count", unread });
}

export async function loadUnreadCount() {
  try {
    setUnread((await api.getUnreadCount()).unread);
  } catch {}
}

export async function loadNotifications({ reset = false } = {}) {
  if (store.loading || (store.done && !reset)) return;
  store.loading = true;
  store.error = false;
  notify({ type: "list" });
  try {
    const page = await api.listNotifications({ cursor: reset ? null : store.cursor, limit: PAGE_SIZE });
    const known = reset ? [] : store.items;
    const ids = new Set(known.map((n) => n.id));
    store.items = [...known, ...page.items.filter((n) => !ids.has(n.id))];
    store.cursor = page.next_cursor;
    store.done = !page.next_cursor;
    store.loaded = true;
  } catch {
    store.error = true;
  }
  store.loading = false;
  notify({ type: "list" });
}

function setRead(ids) {
  store.items.forEach((n) => (ids === null || ids.includes(n.id)) && (n.read = true));
  notify({ type: "list" });
}

export async function markRead(ids) {
  const unread = ids.filter((id) => store.items.find((n) => n.id === id && !n.read));
  if (!unread.length) return;
  setRead(unread);
  try {
    setUnread((await api.markNotificationsRead(unread)).unread);
  } catch {}
}

export async function markAllRead() {
  setRead(null);
  setUnread(0);
  try {
    setUnread((await api.markNotificationsRead(null)).unread);
  } catch {}
}

function upsert(notification) {
  store.items = [notification, ...store.items.filter((n) => n.id !== notification.id)];
  notify({ type: "new", notification });
  notify({ type: "list" });
}

function resync() {
  loadUnreadCount();
  if (store.loaded) loadNotifications({ reset: true });
}

const HANDLERS = {
  "notification:new": (event) => upsert(event.notification),
  "notification:count": (event) => setUnread(event.unread),
  "socket:open": resync,
};

export function startNotifications() {
  if (unsubscribeSocket) return;
  unsubscribeSocket = onSocketEvent((event) => HANDLERS[event.type]?.(event));
  loadUnreadCount();
}

export function stopNotifications() {
  unsubscribeSocket?.();
  unsubscribeSocket = null;
  Object.assign(store, { unread: 0, items: [], cursor: null, done: false, loading: false, loaded: false, error: false });
  notify({ type: "count", unread: 0 });
}
