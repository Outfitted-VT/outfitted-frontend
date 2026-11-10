import { apiBase, apiFetch } from "./auth.js";

const POLL_MS = 5000;
const PING_MS = 25000;
const MAX_BACKOFF_MS = 30000;
const UNAUTHORIZED = 4401;

const listeners = new Set();
let socket = null;
let wanted = false;
let connected = false;
let attempts = 0;
let reconnectTimer = null;
let pollTimer = null;
let pingTimer = null;
let onPoll = () => {};

export function socketUrl() {
  const base = apiBase();
  if (/^https?:/.test(base)) return `${base.replace(/^http/, "ws")}/ws`;
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${location.host}${base}/ws`;
}

export function onSocketEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isConnected() {
  return connected;
}

function emit(event) {
  listeners.forEach((listener) => listener(event));
}

function startPolling() {
  if (pollTimer || !wanted) return;
  pollTimer = setInterval(() => onPoll(), POLL_MS);
}

function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
}

function startPing() {
  clearInterval(pingTimer);
  pingTimer = setInterval(() => send({ type: "ping" }), PING_MS);
}

function scheduleReconnect() {
  if (!wanted || reconnectTimer) return;
  const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts);
  attempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    open();
  }, delay);
}

async function refreshToken() {
  await apiFetch("/users/me").catch(() => null);
}

function handleOpen(ws) {
  ws.send(JSON.stringify({ type: "auth", token: localStorage.getItem("access_token") || "" }));
}

function handleMessage(raw) {
  let event;
  try {
    event = JSON.parse(raw.data);
  } catch {
    return;
  }
  if (event.type === "ready") {
    connected = true;
    attempts = 0;
    stopPolling();
    startPing();
    emit({ type: "socket:open" });
    return;
  }
  if (event.type !== "pong") emit(event);
}

async function handleClose(code) {
  const wasConnected = connected;
  connected = false;
  socket = null;
  clearInterval(pingTimer);
  if (!wanted) return;
  startPolling();
  if (wasConnected) emit({ type: "socket:closed" });
  if (code === UNAUTHORIZED) await refreshToken();
  scheduleReconnect();
}

function open() {
  if (!wanted || socket) return;
  let ws;
  try {
    ws = new WebSocket(socketUrl());
  } catch {
    startPolling();
    return scheduleReconnect();
  }
  socket = ws;
  ws.onopen = () => handleOpen(ws);
  ws.onmessage = handleMessage;
  ws.onclose = (event) => handleClose(event.code);
  ws.onerror = () => ws.close();
}

function onVisible() {
  if (document.visibilityState !== "visible" || !wanted || socket) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  attempts = 0;
  open();
  onPoll();
}

export function connectSocket({ poll }) {
  onPoll = poll;
  if (wanted) return;
  wanted = true;
  document.addEventListener("visibilitychange", onVisible);
  startPolling();
  open();
}

export function disconnectSocket() {
  wanted = false;
  document.removeEventListener("visibilitychange", onVisible);
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  stopPolling();
  clearInterval(pingTimer);
  socket?.close();
  socket = null;
  connected = false;
}

export function send(event) {
  if (socket?.readyState === WebSocket.OPEN && connected) socket.send(JSON.stringify(event));
}
