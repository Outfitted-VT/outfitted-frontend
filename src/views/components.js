import { mediaUrl } from "../fits.js";
import { escapeHtml } from "../format.js";

const stroke = (paths, size = 18, width = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ofIcons = {
  arrow: (s = 18) => stroke('<path d="M5 12h14M13 6l6 6-6 6"/>', s, 2.2),
  arrowUp: (s = 18) => stroke('<path d="M12 19V5M6 11l6-6 6 6"/>', s, 2.2),
  back: (s = 18) => stroke('<path d="M15 6l-6 6 6 6"/>', s, 2.2),
  check: (s = 14) => stroke('<path d="M5 12.5l4.5 4.5L19 7.5"/>', s, 3),
  plus: (s = 24) => stroke('<path d="M12 5v14M5 12h14"/>', s, 2.4),
  bell: (s = 18) => stroke('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', s),
  bellOff: (s = 18) => stroke('<path d="M8.7 3.6A6 6 0 0 1 18 8c0 2.3.4 4 .9 5.3M17 17H3s3-2 3-9c0-.5 0-1 .1-1.5"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0M3 3l18 18"/>', s),
  sparkle: (s = 22) => stroke('<path d="M10 3l1.6 4.6L16 9.2l-4.4 1.6L10 15.4l-1.6-4.6L4 9.2l4.4-1.6z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>', s, 1.9),
  cube: (s = 22) => stroke('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>', s, 1.9),
  chat: (s = 22) => stroke('<path d="M4 5h16v11H9l-5 4z"/>', s, 1.9),
  user: (s = 22) => stroke('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>', s, 1.9),
  people: (s = 20) => stroke('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-5.6 6.5-5.6s6.5 2.1 6.5 5.6"/><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6c2.1.6 3.5 2.4 3.5 5.4"/>', s),
  search: (s = 18) => stroke('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>', s),
  compose: (s = 18) => stroke('<path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L13 14l-4 1 1-4z"/>', s),
  image: (s = 20) => stroke('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>', s),
  clip: (s = 20) => stroke('<path d="M20.5 11.5l-8.3 8.3a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/>', s),
  more: (s = 20) => stroke('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>', s, 2.4),
  info: (s = 18) => stroke('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>', s),
  share: (s = 18) => stroke('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>', s),
  settings: (s = 18) => stroke('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', s),
  zoom: (s = 18) => stroke('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6M11 8v6M8 11h6"/>', s),
  scan: (s = 18) => stroke('<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>', s),
  spin: (s = 18) => stroke('<path d="M3 12c0-2 4-3.5 9-3.5s9 1.5 9 3.5-4 3.5-9 3.5"/><path d="M9 13l3 2.5L9 18"/>', s),
  clock: (s = 12) => stroke('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', s),
  tick: (s = 14) => stroke('<path d="M4 12.5l4.5 4.5L19 6.5"/>', s, 2.2),
  ticks: (s = 16) => stroke('<path d="M2 12.5l4.5 4.5L16 6.5"/><path d="M11 16l1 1L22 6.5"/>', s, 2.2),
  trash: (s = 18) => stroke('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', s),
  close: (s = 18) => stroke('<path d="M6 6l12 12M18 6L6 18"/>', s, 2.2),
  sizeUp: (s = 18) => stroke('<path d="M12 19V5M6 11l6-6 6 6"/>', s),
  heart: (s = 22) => stroke('<path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.3 3 4.2 6.2C19.5 15.4 12 20 12 20z"/>', s, 1.9),
  comment: (s = 22) => stroke('<path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z"/>', s, 1.9),
  bookmark: (s = 22) => stroke('<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>', s, 1.9),
  pencil: (s = 18) => stroke('<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>', s),
  flame: (s = 16) => stroke('<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-2.6 1.4-4.6 3-6.1.3 1.8 1.2 3 2.5 3.6C10 8.6 11.4 5.4 14 3c.4 3 2 4.6 3.4 6.3 1 1.3 1.6 2.9 1.6 4.8 0 4-3.1 6.9-7 6.9z"/>', s, 2),
  snowflake: (s = 16) => stroke('<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5M3.7 10.4L7.1 9.6 6.2 6.2M17.8 17.8l-.9-3.4 3.4-.8M3.7 13.6l3.4.8-.9 3.4M17.8 6.2l-.9 3.4 3.4.8"/>', s, 1.8),
  cloudOff: (s = 24) => stroke('<path d="M3 3l18 18M8.5 6.2A6 6 0 0 1 17.7 10H18a4 4 0 0 1 2.6 7M17 19H7a5 5 0 0 1-1.6-9.7"/>', s, 1.9),
};

const INITIAL_TONES = ["ink", "lime", "blue"];

export const attrs = (map = {}) =>
  Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}="${escapeHtml(value)}"`))
    .join(" ");

export function displayName(user) {
  return user?.full_name || user?.name || user?.username || "";
}

export function initials(user) {
  const words = displayName(user).trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?")[0]).toUpperCase();
}

function toneFor(user) {
  const key = user?.username || displayName(user);
  const sum = [...key].reduce((total, c) => total + c.charCodeAt(0), 0);
  return INITIAL_TONES[sum % INITIAL_TONES.length];
}

export function avatarUrl(user) {
  return user?.avatar?.url || user?.avatarUrl || null;
}

export function avatar(user, { size = 44, cls = "" } = {}) {
  const url = avatarUrl(user);
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px`;
  if (url) {
    return `<span class="of-avatar ${cls}" style="${style}"><img src="${escapeHtml(mediaUrl(url))}" alt="" /></span>`;
  }
  return `<span class="of-avatar of-avatar-${toneFor(user)} ${cls}" style="${style}" aria-hidden="true">${escapeHtml(initials(user))}</span>`;
}

export function pillCta({ label, variant = "dark", disabled = false, cls = "", data = {} }) {
  const icon = ofIcons.arrow();
  return `<button type="button" class="of-cta of-cta-${variant} ${cls}" ${attrs(data)} ${disabled ? "disabled" : ""}>
    <span class="of-cta-label">${label}</span><span class="of-cta-chip">${icon}</span>
  </button>`;
}

export function iconButton({ icon, label, dot = false, cls = "", data = {} }) {
  return `<button type="button" class="of-icon-btn ${cls}" aria-label="${escapeHtml(label)}" ${attrs(data)}>
    ${icon}${dot ? '<i class="of-dot" aria-hidden="true"></i>' : ""}
  </button>`;
}

const BELL = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>`;

export function storyAvatar(user, { size = 64, ring = "none", cls = "" } = {}) {
  return `<span class="of-story-ring ${ring} ${cls}">${avatar(user, { size })}</span>`;
}

export function streakChip(streak) {
  if (!streak?.current) return "";
  const pending = !streak.active_today;
  const label = `${streak.current}-day streak${pending ? ", post today to keep it" : ""}`;
  return `<button type="button" class="of-streak-chip ${pending ? "pending" : ""}" id="btn-streak" aria-label="${escapeHtml(label)}">${ofIcons.flame(16)}<span>${streak.current}</span></button>`;
}

export function paintStreakChip(streak) {
  document.querySelectorAll(".of-header-actions").forEach((actions) => {
    actions.querySelector("#btn-streak")?.remove();
    actions.insertAdjacentHTML("afterbegin", streakChip(streak));
  });
}

export function setBellDot(on) {
  document.querySelectorAll("#btn-notifications").forEach((bell) => {
    const dot = bell.querySelector(".of-bell-dot");
    if (on && !dot) bell.insertAdjacentHTML("beforeend", '<span class="of-bell-dot"></span>');
    if (!on && dot) dot.remove();
    bell.setAttribute("aria-label", on ? "Activity, unread" : "Activity");
  });
}

export function switchInput({ on = false, label, data = {} }) {
  return `<input type="checkbox" role="switch" class="of-switch" aria-label="${escapeHtml(label)}" ${on ? "checked" : ""} ${attrs(data)} />`;
}

export function appHeader({ user, notificationsUnread = false, streak = null }) {
  return `<header class="of-header">
    <div class="of-header-in">
      <a class="of-header-brand" href="#feed" data-nav="feed" aria-label="Outfitted home">
        <span class="of-badge" aria-hidden="true">OF<span class="of-badge-dot"></span></span>
        <span class="of-wordmark">Outfitted</span>
      </a>
      <div class="of-header-actions">
        ${streakChip(streak)}
        <button type="button" class="of-bell" id="btn-notifications" aria-label="${notificationsUnread ? "Activity, unread" : "Activity"}">${BELL}${notificationsUnread ? '<span class="of-bell-dot"></span>' : ""}</button>
        <button type="button" class="of-header-avatar" id="account-badge" aria-label="Account menu">${avatar(user, { size: 44 })}</button>
      </div>
    </div>
  </header>`;
}

const tabIcon = (paths, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const TABS = [
  ["feed", "FEED", tabIcon('<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>')],
  ["room", "3D ROOM", tabIcon('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>')],
  ["post"],
  ["messages", "CHAT", tabIcon('<path d="M4 5h16v11H9l-5 4z"/>')],
  ["profile", "PROFILE", tabIcon('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>')],
];

const PLUS = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

function tabButton([id, label, icon], active, chatUnread) {
  if (id === "post") {
    return `<button type="button" class="of-tab-post" id="btn-mobile-create-fit" aria-label="Post a fit">${PLUS}</button>`;
  }
  const on = active === id;
  const dot = id === "messages" && chatUnread && !on ? '<span class="of-tab-dot" data-chat-unread aria-hidden="true"></span>' : "";
  return `<button type="button" class="of-tab ${on ? "on" : ""}" data-nav="${id}" ${on ? 'aria-current="page"' : ""}>${icon}${dot}${label}</button>`;
}

export function tabBar({ active, chatUnread = false }) {
  return `<nav class="of-tabbar" aria-label="Main">${TABS.map((t) => tabButton(t, active, chatUnread)).join("")}</nav>`;
}

export function setChatUnreadDot(on) {
  document.querySelectorAll('.of-tab[data-nav="messages"]').forEach((tab) => {
    const dot = tab.querySelector("[data-chat-unread]");
    const show = on && !tab.classList.contains("on");
    if (show && !dot) tab.querySelector("svg").insertAdjacentHTML("afterend", '<span class="of-tab-dot" data-chat-unread aria-hidden="true"></span>');
    if (!show && dot) dot.remove();
  });
}

export function stateBlock({ icon, title, body, cta = null, titleSize = 20, cls = "" }) {
  const action = cta ? pillCta({ label: cta.label, variant: cta.variant || "dark", data: cta.data }) : "";
  return `<div class="of-state ${cls}" role="status">
    ${icon ? `<span class="of-state-icon" aria-hidden="true">${icon}</span>` : ""}
    <h2 class="of-state-title" style="font-size:${titleSize}px">${escapeHtml(title)}</h2>
    <p class="of-state-body">${escapeHtml(body)}</p>
    ${action}
  </div>`;
}

