import { currentUser } from "../data.js";
import { listFits, listWardrobeItems, mediaUrl, updateProfile } from "../fits.js";
import { escapeHtml } from "../format.js";
import { avatar, iconButton, ofIcons, stateBlock } from "./components.js";
import { isLive } from "./feed-view.js";
import { pollLeader } from "./fit-card.js";
import { openSheet } from "./sheet.js";
import { currentStreak, subscribe as onStreakChange } from "../streak-store.js";
import { mountNotificationSettings, renderNotificationSettings } from "./notification-settings.js";

const TABS = [
  ["history", "Fit history"],
  ["wardrobe", "Wardrobe"],
  ["saved", "Saved"],
];
const THEMES = [
  ["light", "light_mode", "Light"],
  ["dark", "dark_mode", "Dark"],
  ["system", "contrast", "System"],
];
const STICKER_STYLES = ["lime", "white"];
const PAGE_SIZE = 20;

const profile = { screen: "main", tab: "history", pages: new Map() };

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");
const STYLE_LABELS = { y2k: "Y2K" };

const ICON = (paths, stroke = "currentColor", width = 1.9) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const SHARE = ICON('<path d="M12 15V4M7 8l5-5 5 5"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>');
const SETTINGS = ICON('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>');
const FRIENDS = ICON('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 15c1.6.7 2.6 2.4 3 5"/>', "currentColor", 2);

function streakCount() {
  return currentStreak()?.current ?? currentUser.currentStreak ?? 0;
}

function streakSticker(count) {
  return `<span class="of-sticker white of-sticker-streak" data-streak-sticker>${ofIcons.flame(14)}${count}-day streak</span>`;
}

function stickers() {
  const streak = streakCount();
  const styles = (currentUser.styleTags || []).slice(0, streak ? 1 : 2).map((tag, i) =>
    `<span class="of-sticker ${STICKER_STYLES[i]}">${escapeHtml(STYLE_LABELS[tag] || capitalize(tag))}</span>`
  );
  if (streak) styles.push(streakSticker(streak));
  const fit = [currentUser.topSize && `Size ${currentUser.topSize}`, capitalize(currentUser.fitPreference)].filter(Boolean).join(" · ");
  if (fit) styles.push(`<span class="of-sticker ink">${escapeHtml(fit)}</span>`);
  return styles.length ? `<div class="of-stickers">${styles.join("")}</div>` : "";
}

function hero() {
  return `<section class="of-hero">
    <span class="of-hero-ring" aria-hidden="true"></span>
    <div class="of-hero-top">
      <button type="button" class="of-hero-avatar" id="btn-profile-avatar" aria-label="Change profile photo">${avatar(currentUser, { size: 76 })}</button>
      <input type="file" id="profile-avatar-input" accept="image/jpeg,image/png,image/webp" hidden />
      <div class="of-hero-name"><h1>${escapeHtml(currentUser.name || currentUser.username)}</h1></div>
    </div>
    ${currentUser.bio ? `<p class="of-hero-bio">${escapeHtml(currentUser.bio)}</p>` : ""}
    ${stickers()}
  </section>`;
}

const stat = (id, label, cls = "") => `<div class="of-stat ${cls}"><span class="of-stat-num" id="${id}">–</span><span class="of-stat-label">${label}</span></div>`;

function stats() {
  return `<div class="of-stats four" aria-label="Profile stats">
    ${stat("profile-fit-count", "FITS")}${stat("profile-following-count", "CIRCLE", "blue")}${stat("profile-follower-count", "FOLLOWERS")}${stat("profile-longest-streak", "LONGEST", "streak")}
  </div>`;
}

function paintStreak(root, streak) {
  const longest = root.querySelector("#profile-longest-streak");
  if (longest && streak) longest.textContent = streak.longest;
  const stickersRow = root.querySelector(".of-stickers");
  const fresh = stickers();
  if (stickersRow && fresh) stickersRow.outerHTML = fresh;
}

function tabs() {
  return `<div class="of-tabs" role="tablist" aria-label="Profile sections">${TABS.map(([id, label]) =>
    `<button type="button" role="tab" class="of-tab-link ${profile.tab === id ? "on" : ""}" aria-selected="${profile.tab === id}" data-profile-tab="${id}">${label}</button>`
  ).join("")}</div>`;
}

export function renderProfileView() {
  if (profile.screen === "settings") return renderSettingsView();
  if (profile.screen === "notifications") return renderNotificationSettings();
  return `<section class="of-screen of-profile" id="of-profile">
    <header class="of-profile-head">
      <span class="of-handle">@${escapeHtml((currentUser.username || "").toUpperCase())}</span>
      <div class="of-profile-tools">
        <button type="button" class="of-bell" data-profile-share aria-label="Share profile">${SHARE}</button>
        <button type="button" class="of-bell" data-profile-settings aria-label="Settings">${SETTINGS}</button>
      </div>
    </header>
    ${hero()}
    ${stats()}
    <div class="of-profile-actions">
      <button type="button" class="of-profile-btn ink" data-nav-tab="friends">${FRIENDS}Close Friends</button>
      <button type="button" class="of-profile-btn soft" data-profile-edit>Edit profile</button>
    </div>
    ${tabs()}
    <div class="of-grid" id="profile-grid" role="tabpanel"></div>
    <div class="of-grid-foot" id="profile-grid-foot"></div>
  </section>`;
}

// Settings: the same page header as Friends and My fits, then grouped cards of rows. Styles:
// .of-settings in src/connected.css. The theme buttons are wired in src/main.js
// ([data-theme-option]); Edit profile, Notifications and Back by mountProfile below.
const row = ({ icon, title, sub = "", attrs = "", cls = "", chevron = true }) =>
  `<button type="button" class="of-set-row ${cls}" ${attrs}>
    <span class="of-set-icon material-symbols-outlined" aria-hidden="true">${icon}</span>
    <span class="of-set-text"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</span>
    ${chevron ? '<span class="of-set-chevron material-symbols-outlined" aria-hidden="true">chevron_right</span>' : ""}
  </button>`;

const themeOption = ([value, icon, label]) =>
  `<button type="button" role="radio" data-theme-option="${value}" aria-checked="false"><span class="material-symbols-outlined" aria-hidden="true">${icon}</span>${label}</button>`;

export function renderSettingsView() {
  return `<section class="of-screen of-settings" id="of-profile">
    <header class="of-profile-head">
      ${iconButton({ icon: ofIcons.back(20), label: "Back to profile", data: { "data-profile-back": true } })}
    </header>
    <div class="of-settings-intro">
      <span class="of-friends-kicker">YOUR ACCOUNT</span>
      <h1 class="of-display">Settings</h1>
      <p class="of-friends-sub">Signed in as @${escapeHtml(currentUser.username || "")}</p>
    </div>

    <p class="of-friends-label">Account</p>
    <div class="of-set-card">
      ${row({ icon: "person", title: "Edit profile", sub: "Name, bio and photo", attrs: "data-profile-edit" })}
      ${row({ icon: "notifications", title: "Notifications", sub: "Votes, comments, follows and chats", attrs: 'data-profile-go="notifications"' })}
    </div>

    <p class="of-friends-label" id="settings-appearance">Appearance</p>
    <div class="of-set-card of-set-pad">
      <div class="of-account-theme of-set-theme" role="radiogroup" aria-labelledby="settings-appearance">${THEMES.map(themeOption).join("")}</div>
    </div>

    <p class="of-friends-label">With friends</p>
    <div class="of-set-card">
      ${row({ icon: "groups", title: "Dorm Closets", sub: "Plan event looks and borrow pieces", attrs: "data-open-dorm-closet" })}
      ${row({ icon: "styler", title: "Style a Friend", sub: "Put together a look for someone", attrs: "data-open-style-friend" })}
    </div>

    <div class="of-set-card">
      ${row({ icon: "logout", title: "Sign out", attrs: 'id="btn-profile-signout"', cls: "danger", chevron: false })}
    </div>
  </section>`;
}

function colorDots(fit) {
  const colors = fit.items.map((item) => item.color).filter((c) => c && CSS.supports("color", c)).slice(0, 4);
  return colors.map((c) => `<span style="background:${escapeHtml(c)}"></span>`).join("");
}

function statusTag(fit) {
  if (isLive(fit)) return `<span class="of-hist-tag live">NEW</span>`;
  const date = new Date(fit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `<span class="of-hist-tag">${escapeHtml(date.toUpperCase())}</span>`;
}

function strip(images, tagHtml = "") {
  const shown = images.slice(0, 2).map((image) => `<img src="${escapeHtml(mediaUrl(image.url))}" alt="" loading="lazy" />`);
  return `<div class="of-hist-strip ${shown.length === 1 ? "single" : ""}">${shown.join("")}${tagHtml}</div>`;
}

export function fitCard(fit) {
  const leader = pollLeader(fit);
  const total = leader?.total || 0;
  const verdict = total ? `${leader.pct}% ${escapeHtml(leader.label)}` : leader ? "No votes yet" : "No poll";
  const title = (fit.caption || "Untitled fit").split("\n")[0];
  return `<article class="of-histcard">
    ${strip(fit.images, statusTag(fit))}
    <div class="of-hist-body">
      <span class="of-hist-title">${escapeHtml(title)}</span>
      <span class="of-hist-pct ${total ? "" : "none"}">${verdict}</span>
      <span class="of-hist-dots">${colorDots(fit)}</span>
    </div>
  </article>`;
}

function wardrobeCard(item) {
  const image = item.image_url
    ? `<img src="${escapeHtml(mediaUrl(item.image_url))}" alt="" loading="lazy" />`
    : `<span class="of-hist-empty">${ofIcons.image(24)}</span>`;
  const detail = [item.brand, item.color].filter(Boolean).map(escapeHtml).join(" · ");
  return `<article class="of-histcard">
    <div class="of-hist-strip single">${image}</div>
    <div class="of-hist-body">
      <span class="of-hist-title">${escapeHtml(item.name)}</span>
      <span class="of-hist-meta">${detail || escapeHtml(capitalize(item.primary_category))}</span>
      <span class="of-hist-pct">Worn ${item.times_worn}×</span>
    </div>
  </article>`;
}

const EMPTY = {
  history: "Your fits will show up here once you post.",
  wardrobe: "Add pieces to your wardrobe from My fits.",
  saved: "Fits you save show up here.",
};

async function fetchPage(tab, cursor) {
  if (tab === "wardrobe") return { items: await listWardrobeItems(), next_cursor: null };
  const path = tab === "saved" ? "/users/me/saved" : `/users/${encodeURIComponent(currentUser.username)}/fits`;
  return listFits(path, cursor, PAGE_SIZE);
}

function page(tab) {
  if (!profile.pages.has(tab)) profile.pages.set(tab, { items: [], cursor: null, done: false, loading: false, error: false });
  return profile.pages.get(tab);
}

function paintGrid(root) {
  const grid = root.querySelector("#profile-grid");
  const foot = root.querySelector("#profile-grid-foot");
  if (!grid) return;
  const state = page(profile.tab);
  const card = profile.tab === "wardrobe" ? wardrobeCard : fitCard;
  grid.innerHTML = state.items.map(card).join("");
  if (state.error) foot.innerHTML = stateBlock({ icon: ofIcons.cloudOff(), title: "Couldn't load this tab", body: "Check your connection and try again.", cta: { label: "Try again", data: { "data-grid-more": true } } });
  else if (state.loading) foot.innerHTML = `<p class="of-muted">Loading…</p>`;
  else if (!state.items.length) foot.innerHTML = `<p class="of-muted">${EMPTY[profile.tab]}</p>`;
  else foot.innerHTML = state.done ? "" : `<button type="button" class="of-btn of-btn-soft" data-grid-more>Load more</button>`;
}

async function loadMore(root) {
  const tab = profile.tab;
  const state = page(tab);
  if (state.loading || state.done) return;
  state.loading = true;
  state.error = false;
  paintGrid(root);
  try {
    const result = await fetchPage(tab, state.cursor);
    state.items.push(...result.items);
    state.cursor = result.next_cursor;
    state.done = !result.next_cursor;
  } catch {
    state.error = true;
  }
  state.loading = false;
  if (root.isConnected && profile.tab === tab) paintGrid(root);
}

function setTab(root, tab) {
  profile.tab = tab;
  root.querySelectorAll("[data-profile-tab]").forEach((button) => {
    const on = button.dataset.profileTab === tab;
    button.classList.toggle("on", on);
    button.setAttribute("aria-selected", String(on));
  });
  paintGrid(root);
  if (!page(tab).items.length) loadMore(root);
}

async function share(toast) {
  const text = `Find me on Outfitted: @${currentUser.username}`;
  try {
    if (navigator.share) return await navigator.share({ title: "Outfitted", text });
    await navigator.clipboard.writeText(text);
    toast("Profile handle copied");
  } catch {}
}

// A centered dialog: photo, name and bio, with Cancel / Save.
function editProfile({ toast, rerender }) {
  const name = currentUser.name || "";
  const bio = currentUser.bio || "";
  const { root, close } = openSheet({
    title: "Edit profile",
    variant: "dialog",
    body: `<form class="of-edit-profile" data-edit-form novalidate>
      <div class="of-edit-photo-row">
        ${avatar(currentUser, { size: 72 })}
        <div class="of-edit-who">
          <b>@${escapeHtml(currentUser.username || "")}</b>
          <button type="button" class="of-edit-photo" data-edit-photo>${ofIcons.image(16)}Change photo</button>
        </div>
      </div>
      <label class="of-edit-field">
        <span>Name <em data-count="name">${name.length}/100</em></span>
        <input class="of-field" maxlength="100" data-edit-name value="${escapeHtml(name)}" placeholder="Your name" autocomplete="name" />
      </label>
      <label class="of-edit-field">
        <span>Bio <em data-count="bio">${bio.length}/160</em></span>
        <textarea class="of-field of-edit-bio" maxlength="160" rows="3" data-edit-bio placeholder="A line about your style">${escapeHtml(bio)}</textarea>
      </label>
      <p class="of-toast-error" data-error hidden></p>
      <div class="of-edit-actions">
        <button type="button" class="of-btn of-btn-soft" data-sheet-close>Cancel</button>
        <button type="submit" class="of-btn of-btn-ink" data-edit-save>Save</button>
      </div>
    </form>`,
  });
  for (const [field, max] of [["name", 100], ["bio", 160]]) {
    const input = root.querySelector(`[data-edit-${field}]`);
    input.addEventListener("input", () => {
      root.querySelector(`[data-count="${field}"]`).textContent = `${input.value.length}/${max}`;
    });
  }
  root.querySelector("[data-edit-name]").focus({ preventScroll: true });
  root.querySelector("[data-edit-photo]").addEventListener("click", () => {
    close();
    document.querySelector("#profile-avatar-input")?.click();
  });
  root.querySelector("[data-edit-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const save = root.querySelector("[data-edit-save]");
    save.disabled = true;
    const fullName = root.querySelector("[data-edit-name]").value.trim() || null;
    const bio = root.querySelector("[data-edit-bio]").value.trim() || null;
    try {
      const user = await updateProfile({ fullName, bio });
      Object.assign(currentUser, { name: user.full_name || user.username, bio: user.bio || "" });
      close();
      toast("Profile updated");
      rerender();
    } catch (err) {
      const error = root.querySelector("[data-error]");
      error.hidden = false;
      error.textContent = err.message || "Couldn't save your profile.";
      save.disabled = false;
    }
  });
}

function go(screen, rerender) {
  profile.screen = screen;
  rerender();
}

export function resetProfile() {
  profile.screen = "main";
  profile.pages.clear();
}

export function mountProfile({ toast, rerender }) {
  const root = document.querySelector("#of-profile");
  if (!root) return;
  root.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-profile-tab]");
    if (tab) return setTab(root, tab.dataset.profileTab);
    if (event.target.closest("[data-grid-more]")) return loadMore(root);
    if (event.target.closest("[data-profile-settings]")) return go("settings", rerender);
    if (event.target.closest("[data-profile-back]")) return go("main", rerender);
    const goTo = event.target.closest("[data-profile-go]");
    if (goTo) return go(goTo.dataset.profileGo, rerender);
    if (event.target.closest("[data-profile-share]")) return share(toast);
    if (event.target.closest("[data-profile-edit]")) editProfile({ toast, rerender });
  });
  if (profile.screen === "notifications") return mountNotificationSettings({ toast });
  if (profile.screen !== "main") return;
  profile.pages.clear();
  setTab(root, profile.tab);
  paintStreak(root, currentStreak());
  const release = onStreakChange((streak) => (root.isConnected ? paintStreak(root, streak) : release()));
}
