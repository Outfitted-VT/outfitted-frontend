import { confirmDialog } from "../confirm-dialog.js";
import { mediaUrl } from "../fits.js";
import { escapeHtml, timeAgo } from "../format.js";
import * as messages from "../messages-store.js";
import { avatar, displayName, ofIcons } from "./components.js";
import { openFitCheckSheet, openProductSheet } from "./fit-check-sheet.js";
import { conversationTitle } from "./messages-inbox.js";
import { openSheet } from "./sheet.js";

const GROUP_MS = 2 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;
const HOLD_MS = 500;
const QUICK_CUES = ["10/10 silhouette", "Swap the shoes", "Size up"];

const view = { id: null, unsubscribe: null, observer: null };

const isMine = (message) => message.sender?.id === messages.myId();
const clockTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function dayLabel(iso) {
  const date = new Date(iso);
  const days = Math.floor((new Date(new Date().toDateString()) - new Date(date.toDateString())) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const svg = (size, width, paths, extra = "") =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${paths}</svg>`;

const ICONS = {
  back: svg(18, 2.2, '<path d="M15 6l-6 6 6 6"/>'),
  more: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  photo: svg(20, 1.8, '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>'),
  send: svg(18, 2.4, '<path d="M12 19V5M6 11l6-6 6 6"/>'),
  cube: svg(16, 2.2, '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/>'),
};

function lastSeen(member) {
  if (member?.online) return "Online";
  if (!member?.last_seen_at) return "Offline";
  return `Last seen ${timeAgo(member.last_seen_at).toLowerCase()}`;
}

function headerStatus(conversation) {
  const others = messages.otherMembers(conversation);
  if (conversation.type !== "circle") return lastSeen(others[0]);
  const online = others.filter((m) => m.online).length;
  return `${conversation.members.length} members · ${online} online`;
}

function stackAvatars(conversation) {
  const others = messages.otherMembers(conversation).slice(0, 3);
  return `<div class="of-stack" aria-hidden="true">${others.map((m) => avatar(m.user, { size: 34 })).join("")}</div>`;
}

function header(conversation) {
  return `<header class="of-thread-head">
    <button type="button" class="of-thread-back" data-thread-back aria-label="Back">${ICONS.back}</button>
    ${stackAvatars(conversation)}
    <div class="of-thread-who">
      <h1 class="of-thread-title">${escapeHtml(conversationTitle(conversation))}</h1>
      <span class="of-thread-status">${escapeHtml(headerStatus(conversation))}</span>
    </div>
    <button type="button" class="of-thread-more" data-thread-info aria-label="More">${ICONS.more}</button>
  </header>`;
}

function ticks(status) {
  if (status === "sending") return `<span class="of-tick" aria-label="Sending">${ofIcons.clock()}</span>`;
  if (status === "read") return `<span class="of-tick read" aria-label="Read">${ofIcons.ticks()}</span>`;
  if (status === "delivered") return `<span class="of-tick" aria-label="Delivered">${ofIcons.ticks()}</span>`;
  return `<span class="of-tick" aria-label="Sent">${ofIcons.tick()}</span>`;
}

function meta(message) {
  const status = messages.messageStatus(message);
  if (status === "failed") return `<button type="button" class="of-msg-failed" data-retry="${message.id}">Not sent. Tap to retry</button>`;
  return `<span class="of-msg-meta">${ticks(status)}<time>${clockTime(message.created_at)}</time></span>`;
}

function imageUrl(image) {
  return image?.local ? image.url : image?.url ? mediaUrl(image.url) : "";
}

function fitCheckCard(message, mine) {
  const payload = message.payload || {};
  const votes = message.votes || { wear_pct: 0, rethink_pct: 0, total: 0, my_vote: null };
  const voteLabel = (choice, label, pct) =>
    `<button type="button" class="of-check-vote ${choice} ${votes.my_vote === choice ? "on" : ""}" data-msg-vote="${choice}" aria-pressed="${votes.my_vote === choice}" ${message.local ? "disabled" : ""}>${label} ${pct}%</button>`;
  return `<div class="of-check-card">
    ${payload.image ? `<img class="of-check-photo" src="${escapeHtml(imageUrl(payload.image))}" alt="" />` : ""}
    <div class="of-check-side">
      ${payload.context ? `<span class="of-event-pill"><span></span>${escapeHtml(payload.context)}</span>` : ""}
      <p class="of-check-q">${escapeHtml(payload.question || message.body || "")}</p>
      <div class="of-check-foot">
        <div class="of-check-votes">${voteLabel("wear", "Wear it", votes.wear_pct)}${voteLabel("rethink", "Rethink", votes.rethink_pct)}</div>
        <div class="of-check-track"><div style="width:${votes.wear_pct}%"></div></div>
        ${mine ? `<button type="button" class="of-check-link" data-open-room>Open in 3D Room</button>` : ""}
      </div>
    </div>
  </div>`;
}

function productBubble(message) {
  const product = message.payload?.product || {};
  const thumb = product.image ? `<img src="${escapeHtml(imageUrl(product.image))}" alt="" />` : "";
  const detail = [product.color, product.price].filter(Boolean).map(escapeHtml).join(" · ");
  const tagName = product.url ? "a" : "div";
  const link = product.url ? `href="${escapeHtml(product.url)}" target="_blank" rel="noopener noreferrer"` : "";
  return `<div class="of-bubble of-product">
    ${message.body ? `<span class="of-product-note">${escapeHtml(message.body)}</span>` : ""}
    <${tagName} class="of-product-row" ${link}>
      <span class="of-product-thumb">${thumb}</span>
      <span class="of-product-text"><span class="of-product-name">${escapeHtml(product.name || "")}</span><span class="of-product-detail">${detail}</span></span>
      ${ICONS.cube}
    </${tagName}>
  </div>`;
}

function storyQuote(message, mine) {
  const payload = message.payload || {};
  const owner = mine ? firstName(messages.otherMembers(messages.getConversation(message.conversation_id))[0]?.user) : "";
  const label = mine ? `You replied to ${owner ? `${owner}'s` : "their"} story` : "Replied to your story";
  const thumb = payload.image
    ? `<button type="button" class="of-story-quote" data-open-story="${escapeHtml(payload.story_id)}" aria-label="Open story"><img src="${escapeHtml(imageUrl(payload.image))}" alt="" /></button>`
    : `<span class="of-story-quote gone">Story unavailable</span>`;
  return `<span class="of-story-quote-label">${escapeHtml(label)}</span>${thumb}`;
}

function content(message, mine) {
  if (message.deleted_at) return `<div class="of-bubble deleted">Message deleted</div>`;
  if (message.kind === "story_reply") return `${storyQuote(message, mine)}<div class="of-bubble">${escapeHtml(message.body || "")}</div>`;
  if (message.kind === "fit_check") return fitCheckCard(message, mine);
  if (message.kind === "product") return productBubble(message);
  if (message.kind === "image") {
    const caption = message.body ? `<div class="of-bubble">${escapeHtml(message.body)}</div>` : "";
    return `<img class="of-msg-photo" src="${escapeHtml(imageUrl(message.payload?.image))}" alt="Photo" />${caption}`;
  }
  return `<div class="of-bubble">${escapeHtml(message.body || "")}</div>`;
}

function firstName(user) {
  return displayName(user).split(/\s+/)[0];
}

function messageHtml(message, { first, last, circle, showMeta, afterCard }) {
  const mine = isMine(message);
  const classes = ["of-msg", mine ? "mine" : "theirs", first ? "first" : "", afterCard ? "after-card" : "", message.kind].join(" ");
  const status = mine && (showMeta || message.status === "failed") ? meta(message) : "";
  if (mine) {
    return `<div class="${classes}" data-msg="${message.id}"><div class="of-msg-col">${content(message, true)}${status}</div></div>`;
  }
  const face = circle ? `<span class="of-msg-face">${last ? avatar(message.sender, { size: 28 }) : ""}</span>` : "";
  const name = circle && first ? `<span class="of-msg-name">${escapeHtml(firstName(message.sender))}</span>` : "";
  return `<div class="${classes}" data-msg="${message.id}">${face}<div class="of-msg-col">${name}${content(message, false)}</div></div>`;
}

function sameRun(a, b) {
  return a && b && a.sender?.id === b.sender?.id && new Date(b.created_at) - new Date(a.created_at) < GROUP_MS
    && dayLabel(a.created_at) === dayLabel(b.created_at) && a.kind === "text" && b.kind === "text";
}

function typingHtml(conversation) {
  const typing = messages.typingUsers(conversation.id);
  if (!typing.length) return "";
  const member = conversation.members.find((m) => m.user.id === typing[0]);
  const face = conversation.type === "circle" ? `<span class="of-msg-face">${avatar(member?.user, { size: 28 })}</span>` : "";
  return `<div class="of-msg theirs first last" aria-live="polite">${face}<div class="of-msg-col">
    <div class="of-bubble of-typing" aria-label="${escapeHtml(displayName(member?.user))} is typing"><i></i><i></i><i></i></div>
  </div></div>`;
}

function lastOwnId(list) {
  return [...list].reverse().find((m) => isMine(m) && !m.deleted_at)?.id;
}

function listHtml(conversation) {
  const state = messages.thread(conversation.id);
  const circle = conversation.type === "circle";
  const metaId = lastOwnId(state.messages);
  let day = null;
  const rows = state.messages.map((message, i, all) => {
    const label = dayLabel(message.created_at);
    const divider = label !== day ? `<div class="of-day"><span>${escapeHtml(`${label} ${clockTime(message.created_at)}`.toUpperCase())}</span></div>` : "";
    day = label;
    const first = !sameRun(all[i - 1], message) || Boolean(divider);
    const last = !sameRun(message, all[i + 1]);
    const afterCard = !divider && all[i - 1]?.kind === "fit_check" && !all[i - 1]?.deleted_at;
    return divider + messageHtml(message, { first, last, circle, showMeta: message.id === metaId, afterCard });
  });
  const top = state.done ? "" : `<div class="of-day of-loading-older" data-older><span>LOADING EARLIER MESSAGES…</span></div>`;
  return (state.loaded ? top : "") + rows.join("") + typingHtml(conversation);
}

function cuesHtml() {
  const chips = QUICK_CUES.map((cue) => `<button type="button" class="of-cue" data-cue="${escapeHtml(cue)}">${escapeHtml(cue)}</button>`).join("");
  return `<div class="of-cues"><span class="of-cues-label">QUICK CUE</span>${chips}</div>`;
}

export function renderThread(id) {
  const conversation = messages.getConversation(id);
  return `<section class="of-thread" id="of-thread" data-conversation="${id}">
    <div id="thread-head">${conversation ? header(conversation) : ""}</div>
    <div class="of-thread-body" id="thread-body" aria-live="polite">
      <div id="thread-top" aria-hidden="true"></div>
      <div id="thread-list">${conversation ? listHtml(conversation) : `<div class="of-day"><span>LOADING…</span></div>`}</div>
    </div>
    <button type="button" class="of-new-pill" id="thread-new" hidden>New messages</button>
    ${cuesHtml()}
    <form class="of-composer" id="thread-composer">
      <button type="button" class="of-composer-photo" data-attach aria-label="Add photo">${ICONS.photo}</button>
      <label class="of-composer-field"><span class="of-sr">Message</span><input type="text" maxlength="2000" placeholder="Send feedback or suggest a piece" id="thread-input" autocomplete="off" /></label>
      <button type="submit" class="of-composer-send" id="thread-send" aria-label="Send">${ICONS.send}</button>
      <input type="file" accept="image/*" hidden id="thread-photo" />
    </form>
  </section>`;
}

const $ = (selector) => document.querySelector(selector);

function nearBottom(body) {
  return body.scrollHeight - body.scrollTop - body.clientHeight < NEAR_BOTTOM_PX;
}

function scrollToBottom(body) {
  body.scrollTop = body.scrollHeight;
  $("#thread-new").hidden = true;
}

function paintList(change = {}) {
  const conversation = messages.getConversation(view.id);
  const body = $("#thread-body");
  if (!conversation || !body) return;
  const wasNear = nearBottom(body);
  const before = body.scrollHeight;
  const top = body.scrollTop;
  $("#thread-list").innerHTML = listHtml(conversation);
  if (change.prepended) body.scrollTop = top + (body.scrollHeight - before);
  else if (change.initial || change.sent || wasNear) scrollToBottom(body);
  else if (change.incoming) $("#thread-new").hidden = false;
}

function paintHead() {
  const conversation = messages.getConversation(view.id);
  if (conversation) $("#thread-head").innerHTML = header(conversation);
}

function onStoreChange(change) {
  if (!$("#of-thread")) return;
  if (change.type === "conversations" || change.type === "presence") paintHead();
  if (change.id && change.id !== view.id) return;
  if (["messages", "typing", "receipts"].includes(change.type)) paintList(change);
}


function sendText(text) {
  const body = text.trim();
  if (!body) return;
  messages.sendDraft(view.id, { kind: "text", body });
}

function submit(event) {
  event?.preventDefault();
  const input = $("#thread-input");
  sendText(input.value);
  input.value = "";
}

function sendPhoto(file) {
  if (!file) return;
  messages.sendDraft(view.id, { kind: "image", file, previewUrl: URL.createObjectURL(file) });
}

function attachMenu() {
  const option = (action, icon, label) =>
    `<button type="button" class="of-menu-row" data-attach-option="${action}"><span class="of-menu-icon">${icon}</span>${label}</button>`;
  const { root, close } = openSheet({
    title: "Share",
    body: `<div class="of-sheet-body">${option("photo", ofIcons.image(), "Photo")}${option("fit", ofIcons.sparkle(20), "Fit check")}${option("product", ofIcons.cube(20), "Suggest a piece")}</div>`,
  });
  root.addEventListener("click", (event) => {
    const option = event.target.closest("[data-attach-option]")?.dataset.attachOption;
    if (!option) return;
    close();
    if (option === "photo") $("#thread-photo").click();
    if (option === "fit") openFitCheckSheet({ conversationId: view.id });
    if (option === "product") openProductSheet({ conversationId: view.id });
  });
}

function memberRow(member) {
  const status = member.online ? "Online" : member.last_seen_at ? `Last seen ${timeAgo(member.last_seen_at)}` : "Offline";
  return `<div class="of-person-row">${avatar(member.user, { size: 44 })}
    <span class="of-person-text"><b>${escapeHtml(displayName(member.user))}</b><small>@${escapeHtml(member.user.username)} · ${status}</small></span></div>`;
}

function infoSheet(conversation, { toast, onBack }) {
  const circle = conversation.type === "circle";
  const rename = circle
    ? `<label class="of-field-label">Circle name<input class="of-field" maxlength="80" value="${escapeHtml(conversation.title || "")}" data-rename /></label>`
    : "";
  const { root, close } = openSheet({
    title: conversationTitle(conversation),
    body: `<div class="of-sheet-body">${rename}${conversation.members.map(memberRow).join("")}</div>
      <div class="of-sheet-actions">
        <button type="button" class="of-btn of-btn-soft" data-info-mute>${conversation.muted ? "Unmute" : "Mute"}</button>
        <button type="button" class="of-btn of-btn-ink" data-info-leave>${circle ? "Leave circle" : "Delete chat"}</button>
      </div>`,
  });
  root.querySelector("[data-rename]")?.addEventListener("change", (event) =>
    messages.renameCircle(conversation.id, event.target.value.trim() || null).catch(() => toast("Couldn't rename the circle."))
  );
  root.querySelector("[data-info-mute]").addEventListener("click", async () => {
    close();
    await messages.setMuted(conversation.id, !conversation.muted).catch(() => toast("Couldn't update the chat."));
  });
  root.querySelector("[data-info-leave]").addEventListener("click", async () => {
    close();
    const confirmed = await confirmDialog({
      title: circle ? "Leave this circle?" : "Delete this chat?",
      message: circle ? "You'll stop getting its messages." : "It comes back if they message you again.",
      confirmLabel: circle ? "Leave" : "Delete",
      danger: true,
      onConfirm: () => messages.leave(conversation.id),
    }).catch(() => toast("Couldn't delete the chat."));
    if (confirmed) onBack();
  });
}

function messageActions(messageId, toast) {
  const message = messages.thread(view.id).messages.find((m) => m.id === messageId);
  if (!message || !isMine(message) || message.deleted_at) return;
  const { root, close } = openSheet({
    title: "Message",
    body: `<div class="of-sheet-body"><button type="button" class="of-menu-row danger" data-delete-message>${ofIcons.trash()}Delete for everyone</button></div>`,
  });
  root.querySelector("[data-delete-message]").addEventListener("click", () => {
    close();
    messages.removeMessage(messageId).catch(() => toast("Couldn't delete the message."));
  });
}

function attachHold(body, toast) {
  let timer = null;
  const cancel = () => clearTimeout(timer);
  body.addEventListener("pointerdown", (event) => {
    const message = event.target.closest(".of-msg.mine[data-msg]");
    if (!message || event.target.closest("button, a")) return;
    timer = setTimeout(() => messageActions(message.dataset.msg, toast), HOLD_MS);
  });
  ["pointerup", "pointercancel", "pointerleave", "scroll"].forEach((type) => body.addEventListener(type, cancel, { passive: true }));
  body.addEventListener("contextmenu", (event) => {
    const message = event.target.closest(".of-msg.mine[data-msg]");
    if (!message) return;
    event.preventDefault();
    cancel();
    messageActions(message.dataset.msg, toast);
  });
}

function storyOwnerId(messageId) {
  const message = messages.thread(view.id).messages.find((m) => m.id === messageId);
  if (!message || !isMine(message)) return messages.myId();
  return messages.otherMembers(messages.getConversation(view.id))[0]?.user.id;
}

function handleClick(event, options) {
  const { toast, onBack, onOpenRoom, onOpenStory } = options;
  const story = event.target.closest("[data-open-story]");
  if (story) return onOpenStory(storyOwnerId(story.closest("[data-msg]").dataset.msg), story.dataset.openStory);
  if (event.target.closest("[data-thread-back]")) return onBack();
  if (event.target.closest("[data-thread-info]")) {
    const conversation = messages.getConversation(view.id);
    return conversation && infoSheet(conversation, options);
  }
  if (event.target.closest("[data-attach]")) return attachMenu();
  if (event.target.closest("#thread-new")) return scrollToBottom($("#thread-body"));
  if (event.target.closest("[data-open-room]")) return onOpenRoom();
  const retry = event.target.closest("[data-retry]");
  if (retry) return messages.retry(retry.dataset.retry);
  const cue = event.target.closest("[data-cue]");
  if (cue) return sendText(cue.dataset.cue);
  const voteButton = event.target.closest("[data-msg-vote]");
  if (voteButton) {
    const id = voteButton.closest("[data-msg]").dataset.msg;
    messages.vote(id, voteButton.dataset.msgVote).catch(() => toast("Couldn't save your vote."));
  }
}

function observeTop() {
  view.observer?.disconnect();
  view.observer = new IntersectionObserver(
    (entries) => entries.some((e) => e.isIntersecting) && messages.loadOlder(view.id).catch(() => {}),
    { root: $("#thread-body"), rootMargin: "200px 0px 0px 0px" }
  );
  view.observer.observe($("#thread-top"));
}

function bindComposer() {
  const input = $("#thread-input");
  $("#thread-composer").addEventListener("submit", submit);
  input.addEventListener("input", () => messages.sendTyping(view.id, Boolean(input.value.trim())));
  input.addEventListener("blur", () => messages.sendTyping(view.id, false));
  $("#thread-photo").addEventListener("change", (event) => {
    sendPhoto(event.target.files?.[0]);
    event.target.value = "";
  });
}

export function unmountThread() {
  view.unsubscribe?.();
  view.unsubscribe = null;
  view.observer?.disconnect();
  messages.closeThread();
}

export function mountThread({ id, toast, onBack, onOpenRoom, onOpenStory }) {
  const root = $("#of-thread");
  if (!root) return;
  unmountThread();
  view.id = id;
  const options = { toast, onBack, onOpenRoom, onOpenStory };
  root.addEventListener("click", (event) => handleClick(event, options));
  bindComposer();
  attachHold($("#thread-body"), toast);
  view.unsubscribe = messages.subscribe(onStoreChange);
  messages
    .openThread(id)
    .then(() => {
      paintHead();
      paintList({ initial: true });
      observeTop();
    })
    .catch(() => toast("Couldn't load this conversation."));
}
