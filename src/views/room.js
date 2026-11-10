import { currentUser } from "../data.js";
import { listFits, mediaUrl, translateSize } from "../fits.js";
import { escapeHtml } from "../format.js";
import { avatar, ofIcons } from "./components.js";
import { fitTally } from "./feed-view.js";
import { openSheet } from "./sheet.js";

const VIEWS = ["Front", "Side", "Back"];
const SPIN_MS = 1200;
const SIZE_CATEGORIES = { top: "tops", bottom: "bottoms", dress: "dresses", outerwear: "outerwear", shoes: "shoes" };
const FIT_PREFS = { fitted: "snug", true: "standard", relaxed: "relaxed" };

const room = { fit: null, loaded: false, view: 0, spinning: false, zoom: false, match: null };
let spinTimer = null;

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");

function pickLook(fits) {
  return fits.find((fit) => fit.images.some((image) => image.generated)) || fits[0] || null;
}

const HOTSPOT_MAX_Y = 0.72;
const LEGEND_DOTS = ["blue", "lime", "ink", "soft"];
const DONUT = [
  ["#2340E0", "62 227", 0],
  ["#DCEF63", "62 227", -72],
  ["#121212", "62 227", -144],
  ["#AEB8F5", "52 237", -216],
];

const svg = (size, width, paths) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  rescan: svg(20, 1.8, '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3"/>'),
  zoom: svg(18, 2, '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/>'),
  arrow: svg(14, 2.4, '<path d="M5 12h14M13 6l6 6-6 6"/>'),
  check: svg(13, 3, '<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  spin: svg(16, 2, '<path d="M3 12c0 2.5 4 4.5 9 4.5s9-2 9-4.5-4-4.5-9-4.5"/><path d="M9 14.5l3 2-3 2.5"/>'),
};

function hotspot(item) {
  const left = `${Math.round(item.pin.x * 100)}%`;
  const top = `${Math.round(Math.min(item.pin.y, HOTSPOT_MAX_Y) * 100)}%`;
  const flip = item.pin.x > 0.62 ? "flip" : "";
  if (!item.url) {
    return `<div class="of-owned ${flip}" style="left:${left};top:${top}">${escapeHtml(item.name.toUpperCase())} · OWNED${ICONS.check}</div>`;
  }
  return `<div class="of-hotspot ${flip}" style="left:${left};top:${top}">
    <span class="of-hotspot-dot"></span>
    <a class="of-hotspot-tag" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}${ICONS.arrow}</a>
  </div>`;
}

function stageImage(fit) {
  const image = fit.images[Math.min(room.view, fit.images.length - 1)];
  return `<img class="of-stage-img ${room.zoom ? "zoomed" : ""}" src="${escapeHtml(mediaUrl(image.url))}" alt="Your look, ${VIEWS[room.view].toLowerCase()} view" />`;
}

function segmented(fit) {
  return VIEWS.map((label, i) => {
    const disabled = i >= fit.images.length;
    return `<button type="button" class="of-seg ${room.view === i ? "on" : ""}" data-room-view="${i}" ${disabled ? "disabled" : ""} aria-pressed="${room.view === i}">${label}</button>`;
  }).join("");
}

function stage(fit) {
  const pins = fit.items.filter((item) => item.pin && item.pin.image_id === fit.images[room.view]?.id);
  const match = room.match === null ? "" : `<div class="of-stage-pill"><span></span>${room.match}% fit match</div>`;
  return `<section class="of-stage">
    ${stageImage(fit)}
    ${match}
    <button type="button" class="of-stage-zoom" data-room-zoom aria-label="${room.zoom ? "Zoom out" : "Zoom"}">${ICONS.zoom}</button>
    ${room.zoom ? "" : pins.map(hotspot).join("")}
    <div class="of-stage-bar">
      ${segmented(fit)}
      <button type="button" class="of-spin ${room.spinning ? "on" : ""}" data-room-spin aria-pressed="${room.spinning}" ${fit.images.length < 2 ? "disabled" : ""}>${ICONS.spin}Spin</button>
    </div>
  </section>`;
}

function legendRows(fit) {
  const { total } = fitTally(fit);
  return [
    ["Fit", capitalize(currentUser.fitPreference) || "Not set"],
    ["Tops", currentUser.topSize || "Not set"],
    ["Bottoms", currentUser.bottomSize || "Not set"],
    ["Votes", String(total)],
  ];
}

function donut(score) {
  const arcs = DONUT.map(([color, dash, offset]) => `<circle cx="56" cy="56" r="46" stroke="${color}" stroke-dasharray="${dash}" stroke-dashoffset="${offset}"/>`).join("");
  return `<div class="of-donut">
    <svg width="112" height="112" viewBox="0 0 112 112" fill="none" stroke-width="10" stroke-linecap="round" aria-hidden="true">${arcs}</svg>
    <div class="of-donut-center"><span class="of-donut-score">${score}</span><span class="of-donut-label">fit score</span></div>
  </div>`;
}

function scoreCard(fit) {
  const { pct, total } = fitTally(fit);
  const score = total ? (pct / 10).toFixed(1) : "–";
  const rows = legendRows(fit).map(([name, value], i) =>
    `<div class="of-legend-row"><span class="of-legend-dot ${LEGEND_DOTS[i]}"></span><span class="of-legend-name">${name}</span><span class="of-legend-value">${escapeHtml(value)}</span></div>`
  ).join("");
  return `<section class="of-score" aria-label="Fit score">${donut(score)}<div class="of-legend">${rows}</div></section>`;
}

function lookKicker(fit) {
  const occasion = fit?.occasion_tags?.[0];
  return `LOOK · ${(occasion || "Today").toUpperCase()}`;
}

function emptyRoom() {
  return `<section class="of-stage of-stage-empty">
    <p class="of-card-title">Your fitting room is empty.</p>
    <p class="of-stage-note">Try a look on to see it here, then ask your circle.</p>
    <button type="button" class="of-room-btn lime" data-room-tryon>Try something on</button>
  </section>`;
}

function body() {
  if (!room.loaded) return `<section class="of-stage of-stage-empty"><p class="of-stage-note">Loading your fitting room…</p></section>`;
  const fit = room.fit;
  if (!fit) return emptyRoom();
  return `${stage(fit)}
    ${scoreCard(fit)}
    <div class="of-room-actions">
      <button type="button" class="of-room-btn lime" data-room-ask>Ask my circle</button>
      <button type="button" class="of-room-btn ink" data-room-shop ${fit.items.some((i) => i.url) ? "" : "disabled"}>Shop look</button>
    </div>`;
}

export function renderRoomScreen() {
  return `<section class="of-screen of-room" id="of-room">
    <header class="of-room-head">
      <div class="of-room-heading"><span class="of-room-kicker" id="room-kicker">${escapeHtml(lookKicker(room.fit))}</span><h1 class="of-room-title">Fitting Room</h1></div>
      <div class="of-room-tools">
        <button type="button" class="of-bell" data-room-tryon aria-label="Rescan avatar">${ICONS.rescan}</button>
        <button type="button" class="of-header-avatar" data-nav="profile" aria-label="Your profile">${avatar(currentUser, { size: 44 })}</button>
      </div>
    </header>
    <div id="room-body">${body()}</div>
  </section>`;
}

function paint() {
  const target = document.querySelector("#room-body");
  if (target) target.innerHTML = body();
  const kicker = document.querySelector("#room-kicker");
  if (kicker) kicker.textContent = lookKicker(room.fit);
}

function stopSpin() {
  clearInterval(spinTimer);
  spinTimer = null;
  room.spinning = false;
}

function toggleSpin() {
  if (room.spinning) return stopSpin();
  room.spinning = true;
  spinTimer = setInterval(() => {
    if (!document.querySelector("#of-room")) return stopSpin();
    room.view = (room.view + 1) % Math.min(VIEWS.length, room.fit.images.length);
    paint();
  }, SPIN_MS);
}

function sizeRequests(fit) {
  return fit.items
    .filter((item) => item.brand && SIZE_CATEGORIES[item.category])
    .slice(0, 4)
    .map((item) =>
      translateSize({
        targetBrand: item.brand,
        category: SIZE_CATEGORIES[item.category],
        targetItemFitPref: FIT_PREFS[currentUser.fitPreference] || "standard",
        targetItemName: item.name,
      })
    );
}

async function loadMatch(fit) {
  const results = await Promise.allSettled(sizeRequests(fit));
  const scores = results.filter((r) => r.status === "fulfilled").map((r) => r.value.confidence_score);
  room.match = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  if (room.fit === fit) paint();
}

async function loadLook() {
  try {
    const page = await listFits(`/users/${encodeURIComponent(currentUser.username)}/fits`, null, 20);
    room.fit = pickLook(page.items);
  } catch {
    room.fit = null;
  }
  room.loaded = true;
  room.view = 0;
  room.match = null;
  paint();
  if (room.fit) loadMatch(room.fit);
}

function shopRow(item) {
  const detail = [item.brand, item.color].filter(Boolean).map(escapeHtml).join(" · ");
  return `<a class="of-shop-row" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
    <span><b>${escapeHtml(item.name)}</b><small>${detail}</small></span>${ofIcons.arrow(16)}
  </a>`;
}

function shopLinks(fit) {
  const rows = fit.items.filter((item) => item.url).map(shopRow).join("");
  openSheet({ title: "Shop the look", body: `<div class="of-sheet-body">${rows}</div>` });
}

export function mountRoom({ onTryOn, onAskCircle }) {
  const root = document.querySelector("#of-room");
  if (!root) return;
  stopSpin();
  root.addEventListener("click", (event) => {
    const view = event.target.closest("[data-room-view]");
    if (view && !view.disabled) {
      stopSpin();
      room.view = Number(view.dataset.roomView);
      return paint();
    }
    if (event.target.closest("[data-room-spin]")) {
      toggleSpin();
      return paint();
    }
    if (event.target.closest("[data-room-zoom]")) {
      room.zoom = !room.zoom;
      return paint();
    }
    if (event.target.closest("[data-room-tryon]")) return onTryOn();
    if (event.target.closest("[data-room-ask]") && room.fit) return onAskCircle(room.fit);
    if (event.target.closest("[data-room-shop]") && room.fit) shopLinks(room.fit);
  });
  loadLook();
}
