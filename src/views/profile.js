import { currentUser } from "../data.js";
import { listFits, listWardrobeItems, mediaUrl, updateProfile } from "../fits.js";
import { escapeHtml } from "../format.js";
import { avatar, iconButton, ofIcons, pillCta, stateBlock } from "./components.js";
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
  ["light", "Light"],
  ["dark", "Dark"],
  ["system", "Match system"],
];
const STICKER_STYLES = ["lime", "white"];
const PAGE_SIZE = 20;

const profile = { screen: "main", tab: "history", pages: new Map() };

const studioTile = (icon, title, text, attr) => `
  <button type="button" ${attr}
    class="h-full w-full rounded bg-surface-container-low hover:bg-surface-container border border-surface-container-high text-left transition-colors active:scale-[0.98]">
    <span class="h-full flex flex-col items-start gap-1.5 p-space-sm">
      <span class="w-9 h-9 rounded-full bg-surface-container-lowest border border-surface-container-high flex items-center justify-center text-secondary flex-shrink-0">
        <span class="material-symbols-outlined text-[20px]">${icon}</span>
      </span>
      <span class="font-title-ui text-label-md font-semibold text-on-surface leading-tight mt-0.5">${title}</span>
      <span class="font-body-md text-[12px] leading-snug text-on-surface-variant line-clamp-2">${text}</span>
    </span>
  </button>`;


function studioSections() {
  return `
      <!-- Returns Saved & Impact Counter Dashboard -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm border-l-4 border-secondary">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-secondary">savings</span>
            <span class="font-title-ui text-label-md font-semibold text-on-surface">Returns Saved & Impact</span>
          </div>
          <span class="font-micro-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold" id="impact-badge-label">
            Smart Shopper
          </span>
        </div>
        <p class="font-body-md text-[12px] text-on-surface-variant leading-snug">
          Estimated financial & environmental waste eliminated by sizing validation and peer feedback before checkout.
        </p>

        <div class="grid grid-cols-3 gap-space-2xs text-center pt-1">
          <div class="p-2.5 rounded bg-surface-container-low flex flex-col items-center">
            <span class="font-headline-md text-headline-md font-bold text-secondary" id="impact-dollars-saved">$96</span>
            <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Dollars Saved</span>
          </div>
          <div class="p-2.5 rounded bg-surface-container-low flex flex-col items-center">
            <span class="font-headline-md text-headline-md font-bold text-on-surface" id="impact-trips-avoided">3</span>
            <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Trips Avoided</span>
          </div>
          <div class="p-2.5 rounded bg-surface-container-low flex flex-col items-center">
            <span class="font-headline-md text-headline-md font-bold text-on-surface" id="impact-co2-saved">14.2 kg</span>
            <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant">CO₂ Spared</span>
          </div>
        </div>
      </section>

      <!-- TrueSize Passport & Cross-Brand Translator -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm" id="passport-section">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">straighten</span>
            <span class="font-title-ui text-label-md font-semibold text-on-surface">TrueSize Passport</span>
          </div>
          <button type="button" class="text-secondary font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-0.5" id="btn-toggle-add-reference">
            <span class="material-symbols-outlined text-[15px]">add</span>
            <span>Add piece</span>
          </button>
        </div>

        <p class="font-body-md text-[12px] text-on-surface-variant leading-snug">
          Your calibrated baseline sizes from clothes you already own. We use these specs to map sizing across different vendors.
        </p>

        <!-- Benchmark reference garments list -->
        <div class="flex flex-col gap-1.5" id="passport-garments-list">
          <div class="flex items-center justify-between p-2 rounded bg-surface-container-low text-label-sm">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <strong>Levi's 501</strong>
              <span class="text-on-surface-variant">Bottom · 30W</span>
            </div>
            <span class="font-micro-mono text-[10px] text-secondary font-bold uppercase">Benchmark</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded bg-surface-container-low text-label-sm">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <strong>Zara Ribbed Tee</strong>
              <span class="text-on-surface-variant">Top · Medium</span>
            </div>
            <span class="font-micro-mono text-[10px] text-secondary font-bold uppercase">Benchmark</span>
          </div>
        </div>

        <!-- Add Reference Inline Drawer -->
        <div class="hidden p-3 rounded-lg bg-surface-container-low flex flex-col gap-2 mt-1" id="add-reference-form">
          <strong class="font-label-md text-on-surface">Add Well-Fitting Benchmark Piece</strong>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" id="ref-brand" placeholder="Brand (e.g. Levi's, Zara)" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
            <input type="text" id="ref-item-name" placeholder="Item Name (e.g. 501 Jeans)" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="ref-category" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface">
              <option value="top">Top</option>
              <option value="bottom" selected>Bottom</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
            </select>
            <input type="text" id="ref-size" placeholder="Size (e.g. M, 30W, 32L)" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="px-3 py-1.5 rounded-full text-label-sm font-semibold text-on-surface" id="btn-cancel-add-ref">Cancel</button>
            <button type="button" class="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-semibold" id="btn-save-reference">Save Piece</button>
          </div>
        </div>

        <!-- Cross-Brand Size Translator Tool -->
        <div class="p-3 rounded-lg bg-surface-container-low/70 border border-surface-container-high flex flex-col gap-2 mt-2">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[17px] text-secondary">swap_horizontal_circle</span>
            <strong class="font-label-md text-on-surface">Cross-Brand Size Translator</strong>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="translate-brand" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface">
              <option value="Aritzia">Aritzia</option>
              <option value="Uniqlo">Uniqlo</option>
              <option value="Everlane">Everlane</option>
              <option value="The Frankie Shop">The Frankie Shop</option>
              <option value="ASOS">ASOS</option>
              <option value="Reformation">Reformation</option>
            </select>
            <select id="translate-category" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface">
              <option value="top">Top</option>
              <option value="bottom" selected>Bottom</option>
              <option value="outerwear">Outerwear</option>
              <option value="dress">Dress</option>
            </select>
          </div>
          <button type="button" id="btn-run-translation" class="h-9 rounded-full bg-secondary text-on-secondary font-label-md font-semibold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">psychology</span>
            <span>Translate Size</span>
          </button>
          <div id="translate-result-box" class="hidden p-2.5 rounded bg-surface-container-lowest border border-secondary/30 flex flex-col gap-1 text-label-sm">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-on-surface">Recommended Size: <strong class="text-secondary" id="rec-size-output">Size 4 (S)</strong></span>
              <span class="font-micro-mono text-[9px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded-full font-bold" id="rec-confidence-output">94% Confidence</span>
            </div>
            <p class="text-[11px] text-on-surface-variant leading-snug" id="rec-notes-output">
              Based on your Levi's 30W reference, Aritzia bottoms run slightly narrow in the hip. Ordering a Size 4 ensures relaxed drape.
            </p>
          </div>
        </div>
      </section>

      <!-- Collaborative Fashion Hub -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-secondary">handshake</span>
            <span class="font-title-ui text-label-md font-semibold text-on-surface">Peer Fashion Studio</span>
          </div>
          <span class="font-micro-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">New</span>
        </div>

        <div class="grid grid-cols-2 gap-space-xs pt-1">
          ${studioTile("groups", "Dorm Closets", "Plan event looks & borrow pieces", "data-open-dorm-closet")}
          ${studioTile("styler", "Style a Friend", "Dress your friend's avatar", "data-open-style-friend")}
        </div>

        <button type="button" class="w-full h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-all active:scale-95" data-ai-mode>
          <span class="material-symbols-outlined text-[17px] text-secondary">auto_awesome</span>
          <span>Try this look</span>
        </button>
      </section>
  `;
}

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

function themeOption([value, label]) {
  return `<button type="button" role="radio" class="of-menu-row of-radio-row" data-theme-option="${value}" aria-checked="false">${label}<i aria-hidden="true"></i></button>`;
}

export function renderSettingsView() {
  return `<section class="of-screen of-settings" id="of-profile">
    <header class="of-profile-head">
      ${iconButton({ icon: ofIcons.back(20), label: "Back to profile", data: { "data-profile-back": true } })}
      <h1 class="of-display of-settings-title">Settings</h1>
    </header>
    <section class="of-settings-card" aria-label="Preferences">
      <button type="button" class="of-menu-row of-nav-row" data-profile-go="notifications"><span class="of-menu-icon">${ofIcons.bell(18)}</span>Notifications${ofIcons.arrow(16)}</button>
    </section>
    <section class="of-settings-card" role="radiogroup" aria-label="Appearance">
      <p class="of-meta-label">Appearance</p>
      ${THEMES.map(themeOption).join("")}
    </section>
    <div class="of-settings-studio">${studioSections()}</div>
    <button type="button" class="of-btn of-btn-ink of-signout" id="btn-profile-signout">Sign out</button>
  </section>`;
}

function colorDots(fit) {
  const colors = fit.items.map((item) => item.color).filter((c) => c && CSS.supports("color", c)).slice(0, 4);
  return colors.map((c) => `<span style="background:${escapeHtml(c)}"></span>`).join("");
}

function statusTag(fit) {
  if (isLive(fit)) return `<span class="of-hist-tag live">LIVE</span>`;
  const date = new Date(fit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `<span class="of-hist-tag">${escapeHtml(date.toUpperCase())}</span>`;
}

function strip(images, tagHtml = "") {
  const shown = images.slice(0, 2).map((image) => `<img src="${escapeHtml(mediaUrl(image.url))}" alt="" loading="lazy" />`);
  return `<div class="of-hist-strip ${shown.length === 1 ? "single" : ""}">${shown.join("")}${tagHtml}</div>`;
}

function fitCard(fit) {
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

function editProfile({ toast, rerender }) {
  const { root, close } = openSheet({
    title: "Edit profile",
    body: `<div class="of-sheet-body of-form">
      <label class="of-field-label">Name<input class="of-field" maxlength="100" data-edit-name value="${escapeHtml(currentUser.name || "")}" /></label>
      <label class="of-field-label">Bio<input class="of-field" maxlength="160" data-edit-bio value="${escapeHtml(currentUser.bio || "")}" /></label>
      <button type="button" class="of-menu-row" data-edit-photo><span class="of-menu-icon">${ofIcons.image()}</span>Change photo</button>
    </div>
    <p class="of-toast-error" data-error hidden></p>
    ${pillCta({ label: "Save", data: { "data-edit-save": true } })}`,
  });
  root.querySelector("[data-edit-photo]").addEventListener("click", () => {
    close();
    document.querySelector("#profile-avatar-input")?.click();
  });
  root.querySelector("[data-edit-save]").addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
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
      event.currentTarget.disabled = false;
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
