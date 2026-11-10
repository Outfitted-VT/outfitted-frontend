import { confirmDialog } from "../confirm-dialog.js";
import { escapeHtml } from "../format.js";
import * as messages from "../messages-store.js";
import * as stories from "../stories-store.js";
import { avatar, displayName, iconButton, ofIcons, stateBlock, storyAvatar } from "./components.js";

const SWIPE_OPEN = -176;
const SWIPE_THRESHOLD = -60;

const inbox = { query: "" };

const firstName = (user) => displayName(user).split(/\s+/)[0];

export function shortTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor((new Date(now.toDateString()) - new Date(date.toDateString())) / 86400000);
  if (days === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function conversationTitle(conversation) {
  const others = messages.otherMembers(conversation);
  if (conversation.type === "circle") return conversation.title || others.map((m) => firstName(m.user)).join(", ") || "Circle";
  return displayName(others[0]?.user) || "Chat";
}

function onlineDot(member) {
  return member?.online ? '<i class="of-online" aria-hidden="true"></i>' : "";
}

export function conversationAvatar(conversation, size = 52) {
  const others = messages.otherMembers(conversation);
  if (conversation.type === "circle") {
    const pair = others.slice(0, 2).map((m) => avatar(m.user, { size: 36 })).join("");
    return `<span class="of-avatar-pair" aria-hidden="true">${pair}</span>`;
  }
  return `<span class="of-avatar-wrap">${avatar(others[0]?.user, { size })}${onlineDot(others[0])}</span>`;
}

function previewText(message) {
  if (!message) return "No messages yet";
  if (message.deleted_at) return "Message deleted";
  if (message.kind === "image") return "Photo";
  if (message.kind === "product") return `Suggested: ${message.payload?.product?.name || "a piece"}`;
  if (message.kind === "story_reply") return `Story reply: ${message.body || ""}`;
  return message.body || "";
}

function preview(conversation) {
  const message = conversation.last_message;
  const author = conversation.type === "circle" && message?.sender && message.sender.id !== messages.myId()
    ? `${escapeHtml(firstName(message.sender))}: `
    : "";
  if (message?.kind === "fit_check" && !message.deleted_at) {
    return `<i class="of-fit-dot" aria-hidden="true"></i>${author}Fit check: ${escapeHtml(message.payload?.question || message.body || "")}`;
  }
  return `${author}${escapeHtml(previewText(message))}`;
}

function row(conversation) {
  const unread = conversation.unread_count > 0;
  const time = conversation.last_message ? shortTime(conversation.last_message.created_at) : "";
  return `<li class="of-row-wrap" data-row="${conversation.id}">
    <div class="of-row-actions">
      <button type="button" class="of-row-action ink" data-row-mute>${conversation.muted ? "Unmute" : "Mute"}</button>
      <button type="button" class="of-row-action blue" data-row-delete>Delete</button>
    </div>
    <button type="button" class="of-row ${unread ? "unread" : ""}" data-open-conversation="${conversation.id}">
      ${conversationAvatar(conversation)}
      <span class="of-row-text">
        <span class="of-row-top"><b>${escapeHtml(conversationTitle(conversation))}</b>${conversation.muted ? ofIcons.bellOff(14) : ""}<time>${time}</time></span>
        <span class="of-row-bottom"><span class="of-row-preview">${preview(conversation)}</span>${unread ? `<span class="of-count">${conversation.unread_count > 99 ? "99+" : conversation.unread_count}</span>` : ""}</span>
      </span>
    </button>
  </li>`;
}

function matches(conversation) {
  const query = inbox.query.trim().toLowerCase();
  if (!query) return true;
  const haystack = [conversationTitle(conversation), previewText(conversation.last_message), ...conversation.members.map((m) => m.user.username)];
  return haystack.join(" ").toLowerCase().includes(query);
}

function emptyState() {
  return stateBlock({
    title: "No fit checks yet",
    titleSize: 24,
    body: "Start a circle with the friends whose taste you trust, then ask before you buy.",
    cta: { label: "Start a circle", variant: "lime", data: { "data-inbox-compose": true } },
  });
}

function errorState() {
  return stateBlock({
    icon: ofIcons.cloudOff(),
    title: "Couldn't load conversations",
    body: "Check your connection and try again.",
    cta: { label: "Try again", data: { "data-inbox-retry": true } },
  });
}

function listHtml() {
  if (!messages.isLoaded()) return `<p class="of-muted of-inbox-note">Loading conversations…</p>`;
  const all = messages.conversations();
  if (!all.length) return messages.loadError() ? errorState() : emptyState();
  const shown = all.filter(matches);
  if (!shown.length) return `<p class="of-muted of-inbox-note">No conversations match “${escapeHtml(inbox.query)}”.</p>`;
  return `<ul class="of-rows">${shown.map(row).join("")}</ul>`;
}

function storyState(person) {
  const group = stories.storyGroups().find((g) => g.user.id === person.user.id);
  if (group) return group.has_unseen ? "unseen" : "seen";
  if (person.has_unseen_story) return "unseen";
  return person.has_active_story ? "seen" : "none";
}

function circleItem(person) {
  const state = storyState(person);
  const idle = person.has_live_fit_check ? "unseen" : "seen";
  const ring = state === "none" ? idle : state;
  const action = state === "none" ? "data-circle-user" : "data-circle-story";
  const label = state === "none" ? `Message ${displayName(person.user)}` : `${displayName(person.user)}'s story`;
  return `<button type="button" class="of-circle-person" ${action}="${person.user.id}" aria-label="${escapeHtml(label)}">
    ${storyAvatar(person.user, { size: 64, ring })}${person.online ? '<i class="of-online lg" aria-hidden="true"></i>' : ""}
  </button>`;
}

function circleHtml() {
  const people = messages.circlePeople();
  if (!people?.length) return "";
  return `<p class="of-inbox-label">Circle</p><div class="of-circle-row">${people.map(circleItem).join("")}</div>`;
}

export function renderInbox() {
  return `<section class="of-screen of-inbox" id="of-inbox">
    <header class="of-inbox-head">
      <h1>Messages</h1>
      ${iconButton({ icon: ofIcons.compose(), label: "New chat", data: { "data-inbox-compose": true } })}
    </header>
    <label class="of-search">
      ${ofIcons.search()}
      <input type="search" placeholder="Search conversations" aria-label="Search conversations" value="${escapeHtml(inbox.query)}" data-inbox-search autocomplete="off" />
    </label>
    <div class="of-inbox-circle" id="inbox-circle">${circleHtml()}</div>
    <div id="inbox-list">${listHtml()}</div>
  </section>`;
}

function paintList(root) {
  const list = root.querySelector("#inbox-list");
  if (list) list.innerHTML = listHtml();
}

function paintCircle(root) {
  const circle = root.querySelector("#inbox-circle");
  if (circle) circle.innerHTML = circleHtml();
}

function closeRows(root, except = null) {
  root.querySelectorAll(".of-row.swiped").forEach((rowButton) => {
    if (rowButton === except) return;
    rowButton.classList.remove("swiped");
    rowButton.style.transform = "";
  });
}

function attachSwipe(root) {
  let drag = null;
  root.addEventListener("pointerdown", (event) => {
    const rowButton = event.target.closest(".of-row");
    if (!rowButton || event.pointerType === "mouse") return;
    drag = { rowButton, x: event.clientX, y: event.clientY, dx: 0, base: rowButton.classList.contains("swiped") ? SWIPE_OPEN : 0, moved: false };
  });
  root.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(event.clientY - drag.y) > Math.abs(dx)) return (drag = null);
    if (Math.abs(dx) < 6 && !drag.moved) return;
    drag.moved = true;
    drag.dx = Math.min(0, Math.max(SWIPE_OPEN - 24, drag.base + dx));
    drag.rowButton.style.transition = "none";
    drag.rowButton.style.transform = `translateX(${drag.dx}px)`;
  });
  const end = () => {
    if (!drag) return;
    const { rowButton, moved, dx } = drag;
    drag = null;
    rowButton.style.transition = "";
    if (!moved) return;
    rowButton.dataset.swiping = "1";
    setTimeout(() => delete rowButton.dataset.swiping, 50);
    const open = dx < SWIPE_THRESHOLD;
    closeRows(root, rowButton);
    rowButton.classList.toggle("swiped", open);
    rowButton.style.transform = open ? `translateX(${SWIPE_OPEN}px)` : "";
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
}

async function deleteConversation(id, toast) {
  const conversation = messages.getConversation(id);
  const circle = conversation?.type === "circle";
  const confirmed = await confirmDialog({
    title: circle ? "Leave this circle?" : "Delete this chat?",
    message: circle ? "You'll stop getting its messages." : "It comes back if they message you again.",
    confirmLabel: circle ? "Leave" : "Delete",
    busyLabel: circle ? "Leaving…" : "Deleting…",
    danger: true,
    onConfirm: () => messages.leave(id),
  }).catch(() => toast("Couldn't delete the chat. Try again."));
  return confirmed;
}

async function toggleMute(id, toast) {
  const conversation = messages.getConversation(id);
  try {
    await messages.setMuted(id, !conversation.muted);
  } catch {
    toast("Couldn't update the chat. Try again.");
  }
}

async function openDirect(userId, onOpen, toast) {
  try {
    onOpen(await messages.startConversation({ memberIds: [userId] }));
  } catch (err) {
    toast(err.message || "Couldn't start the chat.");
  }
}

function handleClick(event, root, { onOpen, onCompose, onOpenStory, toast }) {
  if (event.target.closest("[data-inbox-compose]")) return onCompose();
  if (event.target.closest("[data-inbox-retry]")) return messages.loadConversations();
  const story = event.target.closest("[data-circle-story]");
  if (story) return onOpenStory(story.dataset.circleStory);
  const person = event.target.closest("[data-circle-user]");
  if (person) return openDirect(person.dataset.circleUser, onOpen, toast);
  const wrap = event.target.closest("[data-row]");
  if (wrap && event.target.closest("[data-row-mute]")) return toggleMute(wrap.dataset.row, toast);
  if (wrap && event.target.closest("[data-row-delete]")) return deleteConversation(wrap.dataset.row, toast);
  const open = event.target.closest("[data-open-conversation]");
  if (!open || open.dataset.swiping) return;
  if (open.classList.contains("swiped")) return closeRows(root);
  onOpen(open.dataset.openConversation);
}

export function mountInbox({ onOpen, onCompose, onOpenStory, toast }) {
  const root = document.querySelector("#of-inbox");
  if (!root) return () => {};
  root.addEventListener("click", (event) => handleClick(event, root, { onOpen, onCompose, onOpenStory, toast }));
  root.querySelector("[data-inbox-search]").addEventListener("input", (event) => {
    inbox.query = event.target.value;
    paintList(root);
  });
  root.addEventListener("focusin", (event) => {
    const action = event.target.closest(".of-row-action");
    if (action) {
      const rowButton = action.closest(".of-row-wrap").querySelector(".of-row");
      rowButton.classList.add("swiped");
      rowButton.style.transform = `translateX(${SWIPE_OPEN}px)`;
    }
  });
  attachSwipe(root);
  messages.loadCircle();
  messages.loadConversations();
  const releaseStories = stories.subscribe((change) => {
    if (!root.isConnected) return;
    if (change.type === "feed") messages.loadCircle();
    if (change.type === "seen") paintCircle(root);
  });
  const releaseMessages = messages.subscribe((change) => {
    if (!root.isConnected) return;
    if (change.type === "circle") paintCircle(root);
    if (change.type === "presence") paintCircle(root);
    if (["conversations", "presence"].includes(change.type)) paintList(root);
  });
  return () => {
    releaseStories();
    releaseMessages();
  };
}
