import { followUser, getFit, getProfile, mediaUrl } from "../fits.js";
import { escapeHtml, timeAgo } from "../format.js";
import * as notifications from "../notifications-store.js";
import * as stories from "../stories-store.js";
import { avatar, displayName, iconButton, ofIcons, stateBlock } from "./components.js";

const DAY_MS = 86400000;
const STREAK_TYPES = new Set(["streak_reminder", "streak_milestone", "streak_saved", "streak_lost"]);
const SECTIONS = ["New", "Today", "This week", "Earlier"];

const thumbs = new Map();
const following = new Map();
const view = { observer: null, unsubscribe: null };

export const isStreakType = (type) => STREAK_TYPES.has(type);

function sectionOf(item) {
  if (!item.read) return "New";
  const age = Date.now() - new Date(item.created_at).getTime();
  if (new Date(item.created_at).toDateString() === new Date().toDateString()) return "Today";
  return age < 7 * DAY_MS ? "This week" : "Earlier";
}

export function notificationFaces(item, size = 44) {
  if (isStreakType(item.type)) return `<span class="of-note-flame" style="width:${size}px;height:${size}px" aria-hidden="true">${ofIcons.flame(20)}</span>`;
  const actors = item.actors?.length ? item.actors : item.actor ? [item.actor] : [];
  if (item.actor_count > 1 && actors.length > 1) {
    return `<span class="of-note-pair" aria-hidden="true">${actors.slice(0, 2).map((user) => avatar(user, { size: 32 })).join("")}</span>`;
  }
  return actors[0] ? avatar(actors[0], { size }) : `<span class="of-note-flame" style="width:${size}px;height:${size}px" aria-hidden="true">${ofIcons.bell(18)}</span>`;
}

export function notificationText(item) {
  const name = item.actor ? displayName(item.actor) : "";
  const body = item.body || item.title || "";
  if (name && body.startsWith(name)) return `<b>${escapeHtml(name)}</b>${escapeHtml(body.slice(name.length))}`;
  return escapeHtml(body);
}

export function thumbFor(item) {
  const url = thumbs.get(item.entity_id);
  return url ? `<img class="of-note-thumb" src="${escapeHtml(mediaUrl(url))}" alt="" />` : "";
}

function storyThumb(id) {
  return stories.findStory(id)?.story.image?.url || null;
}

export async function resolveThumb(item) {
  if (!item.entity_id || thumbs.has(item.entity_id)) return thumbs.get(item.entity_id) || null;
  if (item.entity_type === "story") thumbs.set(item.entity_id, storyThumb(item.entity_id));
  if (item.entity_type === "fit") {
    thumbs.set(item.entity_id, null);
    const fit = await getFit(item.entity_id).catch(() => null);
    thumbs.set(item.entity_id, fit?.images?.[0]?.url || null);
  }
  return thumbs.get(item.entity_id) || null;
}

async function resolveFollow(item) {
  const username = item.actor?.username;
  if (item.type !== "follow" || !username || following.has(username)) return;
  following.set(username, true);
  const profile = await getProfile(username).catch(() => null);
  following.set(username, profile ? profile.is_following : true);
}

function followButton(item) {
  const username = item.actor?.username;
  if (item.type !== "follow" || !username || following.get(username) !== false) return "";
  return `<button type="button" class="of-follow-back" data-follow-back="${escapeHtml(username)}">Follow back</button>`;
}

function row(item) {
  const follow = followButton(item);
  return `<li class="of-note ${item.read ? "" : "unread"}">
    <button type="button" class="of-note-main" data-note="${item.id}">
      ${item.read ? "" : '<i class="of-note-dot" aria-label="Unread"></i>'}
      ${notificationFaces(item)}
      <span class="of-note-text"><span class="of-note-body">${notificationText(item)}</span><time>${escapeHtml(timeAgo(item.created_at))}</time></span>
      ${follow ? "" : thumbFor(item)}
    </button>
    ${follow}
  </li>`;
}

function listHtml() {
  const items = notifications.notifications();
  const state = notifications.listState();
  if (!state.loaded) {
    return state.error
      ? stateBlock({ icon: ofIcons.cloudOff(), title: "Couldn't load activity", body: "Check your connection and try again.", cta: { label: "Try again", data: { "data-activity-retry": true } } })
      : `<p class="of-muted of-inbox-note">Loading activity…</p>`;
  }
  if (!items.length) {
    return stateBlock({
      title: "No activity yet",
      titleSize: 24,
      body: "Votes, follows, replies and streak news from your circle show up here.",
      cta: { label: "Find friends", variant: "lime", data: { "data-activity-friends": true } },
    });
  }
  const groups = SECTIONS.map((label) => [label, items.filter((item) => sectionOf(item) === label)]).filter(([, list]) => list.length);
  const sections = groups.map(([label, list]) => `<section class="of-note-section"><h2 class="of-note-label">${label}</h2><ul class="of-notes">${list.map(row).join("")}</ul></section>`).join("");
  const foot = state.loading ? `<p class="of-muted of-inbox-note">Loading…</p>` : "";
  return sections + foot;
}

export function renderActivity() {
  const unread = notifications.notifications().some((n) => !n.read) || notifications.unreadCount() > 0;
  return `<section class="of-screen of-activity" id="of-activity">
    <header class="of-activity-head">
      ${iconButton({ icon: ofIcons.back(20), label: "Back", data: { "data-activity-back": true } })}
      <h1 class="of-activity-title">Activity</h1>
      <button type="button" class="of-text-btn" data-activity-read-all ${unread ? "" : "disabled"}>Mark all read</button>
    </header>
    <div id="activity-list">${listHtml()}</div>
    <div id="activity-sentinel" aria-hidden="true"></div>
  </section>`;
}

function paint(root) {
  root.querySelector("#activity-list").innerHTML = listHtml();
  const unread = notifications.notifications().some((n) => !n.read) || notifications.unreadCount() > 0;
  root.querySelector("[data-activity-read-all]").disabled = !unread;
}

async function enrich(root) {
  const pending = notifications.notifications().filter((item) => !thumbs.has(item.entity_id) || (item.type === "follow" && !following.has(item.actor?.username)));
  if (!pending.length) return;
  await Promise.all(pending.map((item) => Promise.all([resolveThumb(item), resolveFollow(item)])));
  if (root.isConnected) paint(root);
}

async function followBack(button, toast) {
  button.disabled = true;
  try {
    await followUser(button.dataset.followBack);
    following.set(button.dataset.followBack, true);
    button.replaceWith(Object.assign(document.createElement("span"), { className: "of-follow-back done", textContent: "Following" }));
  } catch (err) {
    button.disabled = false;
    toast(err.message || "Couldn't follow. Try again.");
  }
}

export function unmountActivity() {
  view.observer?.disconnect();
  view.unsubscribe?.();
  view.observer = null;
  view.unsubscribe = null;
}

export function mountActivity({ onBack, onOpen, onFindFriends, toast }) {
  const root = document.querySelector("#of-activity");
  if (!root) return;
  unmountActivity();
  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-activity-back]")) return onBack();
    if (event.target.closest("[data-activity-friends]")) return onFindFriends();
    if (event.target.closest("[data-activity-retry]")) return notifications.loadNotifications({ reset: true });
    if (event.target.closest("[data-activity-read-all]")) return notifications.markAllRead();
    const follow = event.target.closest("[data-follow-back]");
    if (follow) return followBack(follow, toast);
    const note = event.target.closest("[data-note]");
    const item = note && notifications.notifications().find((n) => n.id === note.dataset.note);
    if (!item) return;
    notifications.markRead([item.id]);
    onOpen(item);
  });
  view.unsubscribe = notifications.subscribe((change) => {
    if (!root.isConnected || !["list", "count"].includes(change.type)) return;
    paint(root);
    if (change.type === "list") enrich(root);
  });
  view.observer = new IntersectionObserver(
    (entries) => entries.some((e) => e.isIntersecting) && notifications.listState().loaded && notifications.loadNotifications(),
    { rootMargin: "400px" }
  );
  view.observer.observe(root.querySelector("#activity-sentinel"));
  notifications.loadNotifications({ reset: true });
}
