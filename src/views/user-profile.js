// Someone else's profile: their photo, name, bio and streak, their counts, Follow and Message, and
// the fits of theirs you're allowed to see. Opened from a name or photo anywhere in the app
// ([data-open-user="username"], handled in src/main.js). Same look as your own profile
// (src/views/profile.js); extra styles are .of-person-page in src/connected.css.

import { followUser, getProfile, listFits, unfollowUser } from "../fits.js";
import { escapeHtml } from "../format.js";
import { avatar, displayName, iconButton, ofIcons, stateBlock } from "./components.js";
import { fitCard } from "./profile.js";

const PAGE_SIZE = 20;
// "Ask them to style me": a Style me request in your chat with them (src/views/style-request-sheet.js).
const SPARKLE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3l1.6 4.6L16 9.2l-4.4 1.6L10 15.4l-1.6-4.6L4 9.2l4.4-1.6z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/></svg>`;
const CHAT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>`;

const person = { username: null, profile: null, error: false, fits: [], cursor: null, done: false, loading: false, fitsError: false };

export function setPerson(username) {
  if (username === person.username) return;
  Object.assign(person, { username, profile: null, error: false, fits: [], cursor: null, done: false, loading: false, fitsError: false });
}

const stat = (value, label, cls = "") =>
  `<div class="of-stat ${cls}"><span class="of-stat-num">${value ?? "–"}</span><span class="of-stat-label">${label}</span></div>`;

function hero(p) {
  const streak = p?.current_streak ? `<span class="of-sticker white of-sticker-streak">${ofIcons.flame(14)}${p.current_streak}-day streak</span>` : "";
  return `<section class="of-hero">
    <span class="of-hero-ring" aria-hidden="true"></span>
    <div class="of-hero-top">
      <span class="of-hero-avatar">${avatar(p || { username: person.username }, { size: 76 })}</span>
      <div class="of-hero-name"><h1>${escapeHtml(p ? displayName(p) : person.username)}</h1></div>
    </div>
    ${p?.bio ? `<p class="of-hero-bio">${escapeHtml(p.bio)}</p>` : ""}
    ${streak ? `<div class="of-stickers">${streak}</div>` : ""}
  </section>`;
}

function body() {
  const p = person.profile;
  if (person.error) {
    return stateBlock({ icon: ofIcons.cloudOff(), title: "Couldn't load this profile", body: "Check your connection and try again.", cta: { label: "Try again", data: { "data-person-retry": true } } });
  }
  return `${hero(p)}
    <div class="of-stats" aria-label="Profile stats">
      ${stat(p?.fit_count, "FITS")}${stat(p?.follower_count, "FOLLOWERS", "blue")}${stat(p?.following_count, "FOLLOWING")}
    </div>
    <div class="of-profile-actions">
      <button type="button" class="of-profile-btn ${p?.is_following ? "soft" : "ink"}" data-person-follow ${p ? "" : "disabled"}>${p?.is_following ? "Following" : "Follow"}</button>
      <button type="button" class="of-profile-btn soft" data-person-message ${p ? "" : "disabled"}>${CHAT}Message</button>
      <button type="button" class="of-profile-btn soft of-person-style" data-person-style ${p ? "" : "disabled"}>${SPARKLE}Ask ${escapeHtml(p ? displayName(p).split(/\s+/)[0] : "them")} to style me</button>
    </div>
    <p class="of-friends-label of-person-label">Fits</p>
    <div class="of-grid" id="person-grid"></div>
    <div class="of-grid-foot" id="person-grid-foot"></div>`;
}

export function renderUserProfile() {
  return `<section class="of-screen of-profile of-person-page" id="of-person">
    <header class="of-profile-head of-person-head">
      ${iconButton({ icon: ofIcons.back(20), label: "Back", data: { "data-person-back": true } })}
      <span class="of-handle">@${escapeHtml((person.username || "").toUpperCase())}</span>
      <span class="of-person-head-gap" aria-hidden="true"></span>
    </header>
    <div id="person-body">${body()}</div>
  </section>`;
}

function paintBody(root) {
  root.querySelector("#person-body").innerHTML = body();
  paintGrid(root);
}

function paintGrid(root) {
  const grid = root.querySelector("#person-grid");
  const foot = root.querySelector("#person-grid-foot");
  if (!grid) return;
  grid.innerHTML = person.fits.map((fit) => `<div class="of-person-fit" data-open-fit="${escapeHtml(fit.id)}" role="button" tabindex="0">${fitCard(fit)}</div>`).join("");
  if (person.fitsError) foot.innerHTML = stateBlock({ icon: ofIcons.cloudOff(), title: "Couldn't load fits", body: "Check your connection and try again.", cta: { label: "Try again", data: { "data-person-more": true } } });
  else if (person.loading) foot.innerHTML = `<p class="of-muted">Loading…</p>`;
  else if (!person.fits.length) foot.innerHTML = `<p class="of-muted">${person.profile?.fit_count === 0 || person.done ? "No fits to show yet." : ""}</p>`;
  else foot.innerHTML = person.done ? "" : `<button type="button" class="of-btn of-btn-soft" data-person-more>Load more</button>`;
}

async function loadProfile(root) {
  const username = person.username;
  person.error = false;
  try {
    const profile = await getProfile(username);
    if (username !== person.username) return;
    person.profile = profile;
  } catch {
    if (username !== person.username) return;
    person.error = true;
  }
  if (root.isConnected) paintBody(root);
}

async function loadFits(root) {
  const username = person.username;
  if (person.loading || person.done) return;
  person.loading = true;
  person.fitsError = false;
  paintGrid(root);
  try {
    const result = await listFits(`/users/${encodeURIComponent(username)}/fits`, person.cursor, PAGE_SIZE);
    if (username !== person.username) return;
    person.fits.push(...result.items);
    person.cursor = result.next_cursor;
    person.done = !result.next_cursor;
  } catch {
    if (username !== person.username) return;
    person.fitsError = true;
  }
  person.loading = false;
  if (root.isConnected) paintGrid(root);
}

async function toggleFollow(root, button, { toast, onFollowChanged }) {
  const p = person.profile;
  if (!p) return;
  button.disabled = true;
  const on = !p.is_following;
  try {
    await (on ? followUser : unfollowUser)(p.username);
    person.profile = { ...p, is_following: on, follower_count: p.follower_count + (on ? 1 : -1) };
    // Following can change which of their fits you see (Friends fits need a mutual follow).
    Object.assign(person, { fits: [], cursor: null, done: false });
    paintBody(root);
    loadFits(root);
    onFollowChanged?.();
  } catch (err) {
    button.disabled = false;
    toast?.(err.message || "Couldn't update. Try again.");
  }
}

// options: { toast, onBack, onMessage(userId), onAskStyle(profile), onOpenFit(fitId), onFollowChanged }
export function mountUserProfile(options) {
  const root = document.querySelector("#of-person");
  if (!root) return;
  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-person-back]")) return options.onBack?.();
    if (event.target.closest("[data-person-retry]")) return loadProfile(root);
    if (event.target.closest("[data-person-more]")) return loadFits(root);
    const fit = event.target.closest("[data-open-fit]");
    if (fit) return options.onOpenFit?.(fit.dataset.openFit);
    if (event.target.closest("[data-person-message]") && person.profile) return options.onMessage?.(person.profile.id);
    if (event.target.closest("[data-person-style]") && person.profile) return options.onAskStyle?.(person.profile);
    const follow = event.target.closest("[data-person-follow]");
    if (follow) toggleFollow(root, follow, options);
  });
  root.addEventListener("keydown", (event) => {
    const fit = event.target.closest?.("[data-open-fit]");
    if (fit && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      options.onOpenFit?.(fit.dataset.openFit);
    }
  });
  // Always fresh on open (counts and follow state change elsewhere).
  Object.assign(person, { fits: [], cursor: null, done: false, loading: false, fitsError: false });
  paintGrid(root);
  loadProfile(root);
  loadFits(root);
}
