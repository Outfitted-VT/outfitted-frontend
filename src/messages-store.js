import { currentUser } from "./data.js";
import { uploadImage } from "./fits.js";
import * as api from "./messages-api.js";
import { connectSocket, disconnectSocket, onSocketEvent, send as socketSend } from "./messages-socket.js";

const TYPING_SHOW_MS = 6000;
const TYPING_SEND_MS = 3000;
const TYPING_IDLE_MS = 4000;
const READ_DEBOUNCE_MS = 300;

const store = {
  conversations: new Map(),
  loaded: false,
  error: null,
  circle: null,
  threads: new Map(),
  typing: new Map(),
  openId: null,
};

const listeners = new Set();
const pendingDelivered = new Set();
const readTimers = new Map();
const typingSent = new Map();
let unsubscribeSocket = null;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(change) {
  listeners.forEach((listener) => listener(change));
}

export const myId = () => currentUser.id;
export const isLoaded = () => store.loaded;
export const loadError = () => store.error;
export const getConversation = (id) => store.conversations.get(id);
export const circlePeople = () => store.circle;
export const openConversationId = () => store.openId;

export function conversations() {
  return [...store.conversations.values()].sort(
    (a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at)
  );
}

export function unreadTotal() {
  return conversations().reduce((total, c) => total + (c.muted ? 0 : c.unread_count), 0);
}

export function thread(id) {
  if (!store.threads.has(id)) {
    store.threads.set(id, { messages: [], cursor: null, done: false, loading: false, loaded: false });
  }
  return store.threads.get(id);
}

export function typingUsers(id) {
  return [...(store.typing.get(id)?.keys() || [])];
}

export function otherMembers(conversation) {
  return conversation?.members.filter((member) => member.user.id !== myId()) || [];
}

const byTime = (a, b) => new Date(a.created_at) - new Date(b.created_at) || (a.id < b.id ? -1 : 1);

function mergeMessages(state, incoming) {
  const byId = new Map(state.messages.map((m) => [m.id, m]));
  incoming.forEach((message) => {
    const local = message.client_id && state.messages.find((m) => m.local && m.client_id === message.client_id);
    if (local) byId.delete(local.id);
    byId.set(message.id, message);
  });
  state.messages = [...byId.values()].sort(byTime);
}

function findMessage(messageId) {
  for (const state of store.threads.values()) {
    const message = state.messages.find((m) => m.id === messageId);
    if (message) return message;
  }
  return null;
}

function replaceMessage(updated) {
  const state = thread(updated.conversation_id);
  state.messages = state.messages.map((m) => (m.id === updated.id ? updated : m));
  const conversation = getConversation(updated.conversation_id);
  if (conversation?.last_message?.id === updated.id) conversation.last_message = updated;
  notify({ type: "messages", id: updated.conversation_id });
}

export function messageStatus(message) {
  if (message.status) return message.status;
  const others = otherMembers(getConversation(message.conversation_id));
  if (!others.length) return "sent";
  const sent = new Date(message.created_at);
  const reached = (key) => others.every((m) => m[key] && new Date(m[key]) >= sent);
  if (reached("last_read_at")) return "read";
  if (reached("last_delivered_at")) return "delivered";
  return "sent";
}

function myMember(conversation) {
  return conversation.members.find((m) => m.user.id === myId());
}

function needsDelivery(conversation) {
  const last = conversation.last_message;
  if (!last || last.sender?.id === myId() || !conversation.unread_count) return false;
  const delivered = myMember(conversation)?.last_delivered_at;
  return !delivered || new Date(delivered) < new Date(last.created_at);
}

function acknowledgeDelivery(id) {
  if (pendingDelivered.has(id)) return;
  pendingDelivered.add(id);
  api.markDelivered(id).catch(() => {}).finally(() => pendingDelivered.delete(id));
}

export async function loadConversations() {
  try {
    const list = await api.listConversations();
    const ids = new Set(list.map((c) => c.id));
    [...store.conversations.keys()].filter((id) => !ids.has(id)).forEach((id) => store.conversations.delete(id));
    list.forEach((c) => store.conversations.set(c.id, c));
    list.filter(needsDelivery).forEach((c) => acknowledgeDelivery(c.id));
    store.error = null;
  } catch (err) {
    store.error = err;
  }
  store.loaded = true;
  notify({ type: "conversations" });
}

export async function loadCircle() {
  try {
    store.circle = await api.getCircle();
  } catch {
    store.circle = store.circle || [];
  }
  notify({ type: "circle" });
}

async function refreshConversation(id) {
  try {
    store.conversations.set(id, await api.getConversation(id));
  } catch (err) {
    if (err.status === 404) store.conversations.delete(id);
  }
  notify({ type: "conversations" });
}

export async function loadNewest(id) {
  const state = thread(id);
  const page = await api.listMessages(id);
  mergeMessages(state, page.items);
  if (!state.loaded) {
    state.cursor = page.next_cursor;
    state.done = !page.next_cursor;
    state.loaded = true;
  }
  notify({ type: "messages", id });
}

export async function loadOlder(id) {
  const state = thread(id);
  if (state.done || state.loading || !state.loaded) return;
  state.loading = true;
  try {
    const page = await api.listMessages(id, { before: state.cursor });
    mergeMessages(state, page.items);
    state.cursor = page.next_cursor;
    state.done = !page.next_cursor;
  } finally {
    state.loading = false;
  }
  notify({ type: "messages", id, prepended: true });
}

function scheduleRead(id) {
  clearTimeout(readTimers.get(id));
  readTimers.set(id, setTimeout(() => markRead(id), READ_DEBOUNCE_MS));
}

async function markRead(id) {
  const conversation = getConversation(id);
  if (conversation) {
    conversation.unread_count = 0;
    notify({ type: "conversations" });
  }
  try {
    applyReceipt(await api.markRead(id));
  } catch {}
}

export async function openThread(id) {
  store.openId = id;
  if (!getConversation(id)) await refreshConversation(id);
  if (!thread(id).loaded) await loadNewest(id);
  scheduleRead(id);
}

export function closeThread() {
  if (store.openId) sendTyping(store.openId, false);
  store.openId = null;
}

function localPayload(draft) {
  const image = draft.previewUrl ? { url: draft.previewUrl, local: true } : null;
  if (draft.kind === "image") return { image };
  if (draft.kind === "fit_check") return { image, question: draft.question, context: draft.context || null };
  if (draft.kind === "product") return { product: { ...draft.product, image: null } };
  return null;
}

function requestBody(draft, clientId) {
  const body = {
    kind: draft.kind,
    body: draft.body,
    image_id: draft.imageId,
    question: draft.question,
    context: draft.context,
    fit_id: draft.fitId,
    product: draft.product,
    client_id: clientId,
  };
  Object.keys(body).forEach((key) => (body[key] === undefined || body[key] === null) && delete body[key]);
  return body;
}

function emptyVotes() {
  return { wear: 0, rethink: 0, total: 0, wear_pct: 0, rethink_pct: 0, my_vote: null };
}

function meSummary() {
  return { id: myId(), username: currentUser.username, full_name: currentUser.name, avatar: currentUser.avatarUrl ? { url: currentUser.avatarUrl } : null };
}

function bumpConversation(message) {
  const conversation = getConversation(message.conversation_id);
  if (!conversation) return;
  conversation.last_message = message;
  conversation.last_activity_at = message.created_at;
  notify({ type: "conversations" });
}

async function deliver(local) {
  const { draft } = local;
  try {
    if (draft.file && !draft.imageId) draft.imageId = (await uploadImage(draft.file)).id;
    const saved = await api.sendMessage(local.conversation_id, requestBody(draft, local.client_id));
    mergeMessages(thread(local.conversation_id), [saved]);
    bumpConversation(saved);
  } catch (err) {
    local.status = "failed";
    local.error = err.message;
  }
  notify({ type: "messages", id: local.conversation_id });
}

export function sendDraft(id, draft) {
  const clientId = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const local = {
    id: `local-${clientId}`,
    local: true,
    client_id: clientId,
    conversation_id: id,
    sender: meSummary(),
    kind: draft.kind,
    body: draft.kind === "fit_check" ? draft.question : draft.body || null,
    payload: localPayload(draft),
    votes: draft.kind === "fit_check" ? emptyVotes() : null,
    created_at: new Date().toISOString(),
    status: "sending",
    draft,
  };
  const state = thread(id);
  state.messages = [...state.messages, local];
  sendTyping(id, false);
  notify({ type: "messages", id, sent: true });
  bumpConversation(local);
  return deliver(local);
}

export function retry(messageId) {
  const local = findMessage(messageId);
  if (!local?.local || local.status !== "failed") return;
  local.status = "sending";
  notify({ type: "messages", id: local.conversation_id });
  deliver(local);
}

function applyTally(message, tally, keepMine = true) {
  const votes = { ...tally, my_vote: keepMine ? message.votes?.my_vote ?? null : tally.my_vote };
  delete votes.message_id;
  delete votes.conversation_id;
  delete votes.type;
  replaceMessage({ ...message, votes });
}

function optimisticVotes(votes, choice) {
  const next = { ...votes };
  if (next.my_vote) next[next.my_vote] = Math.max(0, next[next.my_vote] - 1);
  next[choice] += 1;
  next.total = next.wear + next.rethink;
  next.wear_pct = next.total ? Math.round((next.wear * 100) / next.total) : 0;
  next.rethink_pct = next.total ? 100 - next.wear_pct : 0;
  next.my_vote = choice;
  return next;
}

export async function vote(messageId, choice) {
  const message = findMessage(messageId);
  if (!message || message.local || message.votes?.my_vote === choice) return;
  replaceMessage({ ...message, votes: optimisticVotes(message.votes || emptyVotes(), choice) });
  try {
    applyTally(findMessage(messageId), await api.voteMessage(messageId, choice), false);
  } catch (err) {
    replaceMessage(message);
    throw err;
  }
}

export async function removeMessage(messageId) {
  const message = findMessage(messageId);
  if (!message) return;
  if (message.local) {
    const state = thread(message.conversation_id);
    state.messages = state.messages.filter((m) => m.id !== messageId);
    return notify({ type: "messages", id: message.conversation_id });
  }
  replaceMessage({ ...message, deleted_at: new Date().toISOString(), body: null, payload: null });
  try {
    await api.deleteMessage(messageId);
  } catch (err) {
    replaceMessage(message);
    throw err;
  }
}

function setTyping(id, userId, on) {
  const users = store.typing.get(id) || new Map();
  clearTimeout(users.get(userId));
  if (on) users.set(userId, setTimeout(() => setTyping(id, userId, false), TYPING_SHOW_MS));
  else users.delete(userId);
  store.typing.set(id, users);
  notify({ type: "typing", id });
}

export function sendTyping(id, on) {
  const sent = typingSent.get(id);
  clearTimeout(sent?.idle);
  if (!on) {
    if (sent) socketSend({ type: "typing:stop", conversation_id: id });
    typingSent.delete(id);
    return;
  }
  const now = Date.now();
  const fresh = !sent || now - sent.at > TYPING_SEND_MS;
  if (fresh) socketSend({ type: "typing:start", conversation_id: id });
  const idle = setTimeout(() => sendTyping(id, false), TYPING_IDLE_MS);
  typingSent.set(id, { at: fresh ? now : sent.at, idle });
}

function applyReceipt(receipt) {
  const conversation = getConversation(receipt.conversation_id);
  const member = conversation?.members.find((m) => m.user.id === receipt.user_id);
  if (!member) return;
  member.last_read_at = receipt.last_read_at;
  member.last_delivered_at = receipt.last_delivered_at;
  notify({ type: "receipts", id: receipt.conversation_id });
}

function applyPresence({ user_id: userId, online, last_seen_at: lastSeen }) {
  store.conversations.forEach((conversation) =>
    conversation.members
      .filter((m) => m.user.id === userId)
      .forEach((m) => Object.assign(m, { online, last_seen_at: lastSeen }))
  );
  store.circle?.filter((p) => p.user.id === userId).forEach((p) => Object.assign(p, { online, last_seen_at: lastSeen }));
  notify({ type: "presence" });
}

function isViewing(id) {
  return store.openId === id && document.visibilityState === "visible";
}

function onNewMessage(message) {
  const id = message.conversation_id;
  const conversation = getConversation(id);
  if (!conversation) return refreshConversation(id);
  if (thread(id).loaded) mergeMessages(thread(id), [message]);
  const mine = message.sender?.id === myId();
  if (message.sender) setTyping(id, message.sender.id, false);
  conversation.last_message = message;
  conversation.last_activity_at = message.created_at;
  if (!mine && isViewing(id)) scheduleRead(id);
  else if (!mine) {
    conversation.unread_count += 1;
    acknowledgeDelivery(id);
  }
  notify({ type: "messages", id, incoming: !mine });
  notify({ type: "conversations" });
}

function onDeleted({ message_id: messageId, conversation_id: id }) {
  const message = findMessage(messageId);
  if (message) replaceMessage({ ...message, deleted_at: message.deleted_at || new Date().toISOString(), body: null, payload: null });
  else if (getConversation(id)?.last_message?.id === messageId) refreshConversation(id);
}

function onVote(event) {
  const message = findMessage(event.message_id);
  if (message) applyTally(message, event);
}

function resync() {
  loadConversations();
  if (store.openId) loadNewest(store.openId).catch(() => {});
}

const HANDLERS = {
  "message:new": (e) => onNewMessage(e.message),
  "message:deleted": onDeleted,
  "vote:update": onVote,
  "receipt:update": applyReceipt,
  "typing:start": (e) => setTyping(e.conversation_id, e.user_id, true),
  "typing:stop": (e) => setTyping(e.conversation_id, e.user_id, false),
  "presence:update": applyPresence,
  "conversation:update": (e) => refreshConversation(e.conversation_id),
  "socket:open": resync,
};

export function startMessaging() {
  if (unsubscribeSocket) return;
  unsubscribeSocket = onSocketEvent((event) => HANDLERS[event.type]?.(event));
  connectSocket({ poll: resync });
  loadConversations();
}

export function stopMessaging() {
  unsubscribeSocket?.();
  unsubscribeSocket = null;
  disconnectSocket();
  store.conversations.clear();
  store.threads.clear();
  store.typing.clear();
  store.circle = null;
  store.loaded = false;
  store.openId = null;
  notify({ type: "conversations" });
}

function existingDirect(userId) {
  return conversations().find((c) => c.type === "direct" && c.members.some((m) => m.user.id === userId));
}

export async function startConversation({ memberIds, title = null }) {
  if (memberIds.length === 1 && existingDirect(memberIds[0])) return existingDirect(memberIds[0]).id;
  const type = memberIds.length === 1 ? "direct" : "circle";
  const conversation = await api.createConversation({ type, memberIds, title: type === "circle" ? title : null });
  store.conversations.set(conversation.id, conversation);
  notify({ type: "conversations" });
  return conversation.id;
}

export async function setMuted(id, muted) {
  store.conversations.set(id, await api.updateConversation(id, { muted }));
  notify({ type: "conversations" });
}

export async function renameCircle(id, title) {
  store.conversations.set(id, await api.updateConversation(id, { title }));
  notify({ type: "conversations" });
}

export async function leave(id) {
  await api.leaveConversation(id);
  store.conversations.delete(id);
  store.threads.delete(id);
  notify({ type: "conversations" });
}
