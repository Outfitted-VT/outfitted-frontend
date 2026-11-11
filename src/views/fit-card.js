// A posted fit, as returned by the API (see "The fit object" in the backend's docs/API.md).

import { mediaUrl } from "../fits.js";
import { escapeHtml, timeAgo } from "../format.js";
import { icons } from "../icons.js";

export const aiBadge = (extra = "") => `
  <span class="ai-badge ${extra}" title="Generated with AI virtual try-on">
    <span class="material-symbols-outlined text-[13px]">auto_awesome</span>AI try-on
  </span>`;

const LIVE_MS = 24 * 60 * 60 * 1000;
const PHOTO_ZOOM = "background-size:260%;";
const CHECK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

export const isLiveFit = (fit) => Date.now() - new Date(fit.created_at).getTime() < LIVE_MS;

function imageFor(item, fit, index) {
  return fit.images.find((i) => i.id === item.pin?.image_id) || fit.images[index] || fit.images[0];
}

function sharesPhoto(item, fit) {
  return Boolean(item.pin) && fit.items.filter((other) => other.pin?.image_id === item.pin.image_id).length > 1;
}

function crop(item, fit, index) {
  const image = imageFor(item, fit, index);
  if (!image) return "";
  const zoom = sharesPhoto(item, fit);
  const position = zoom ? `${Math.round(item.pin.x * 100)}% ${Math.round(item.pin.y * 100)}%` : "center";
  return `background-image:url('${escapeHtml(mediaUrl(image.url))}');background-position:${position};${zoom ? PHOTO_ZOOM : ""}`;
}

const PENCIL = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
const TRASH = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;

// mine: your own fit, with Edit and Delete (src/feed.js handles data-fit-edit / data-fit-delete).
function header(fit, mine) {
  const live = isLiveFit(fit) ? `<span class="of-live-tag"><span></span>LIVE</span>` : "";
  const owner = mine
    ? `<span class="of-fitcard-owner">
        <button type="button" class="of-fitcard-icon" data-fit-edit aria-label="Edit fit">${PENCIL}</button>
        <button type="button" class="of-fitcard-icon" data-fit-delete aria-label="Delete fit">${TRASH}</button>
      </span>`
    : "";
  return `<div class="of-fitcard-head">
    ${live}
    <span class="of-fitcard-handle">@${escapeHtml(fit.author.username)}</span>
    <span class="of-fitcard-time">${timeAgo(fit.created_at)}</span>
    ${owner}
  </div>`;
}

function piece(item, fit, i) {
  return `<figure class="of-piece">
    <span class="of-piece-photo" style="${crop(item, fit, i)}" role="img" aria-label="${escapeHtml(item.name)}"></span>
    <figcaption><span class="of-piece-name">${escapeHtml(item.name)}</span><span class="of-piece-color">${escapeHtml(item.color || item.brand || "")}</span></figcaption>
  </figure>`;
}

// The gallery frame takes the cover photo's shape, kept between portrait 4:5 and landscape
// 1.91:1. Nothing is cropped: a photo that doesn't match is shown whole over a blurred copy.
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;

function frameRatio(image) {
  if (!image?.width || !image?.height) return MIN_RATIO;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, image.width / image.height));
}

// A try-on post shows its photos whole rather than cut into pieces: the whole look is the point.
// Several photos swipe, or use the arrows; src/feed.js keeps the arrows, counter and dots in step.
function gallery(fit) {
  const ratio = frameRatio(fit.images[0]);
  const count = fit.images.length;
  const slides = fit.images
    .map(
      (image, i) => `<div class="fit-slide" style="aspect-ratio:${ratio}">
        <img class="fit-slide-backdrop" alt="" aria-hidden="true" loading="lazy" src="${escapeHtml(mediaUrl(image.url))}" />
        <img class="of-gallery-photo" alt="Photo ${i + 1} of ${count}" loading="lazy" src="${escapeHtml(mediaUrl(image.url))}" />
        ${image.generated ? aiBadge("absolute top-3 left-3") : ""}
      </div>`
    )
    .join("");
  if (count < 2) return `<div class="of-gallery"><div class="of-gallery-frame"><div class="fit-slides" data-slides>${slides}</div></div></div>`;
  const arrow = (step, icon, label, hidden) => `
    <button type="button" class="fit-arrow ${step < 0 ? "left-2" : "right-2"}" data-slide-step="${step}" aria-label="${label}" ${hidden ? "hidden" : ""}>
      <span class="material-symbols-outlined text-[20px]">${icon}</span>
    </button>`;
  const dots = fit.images.map((_, i) => `<span class="fit-dot ${i === 0 ? "active" : ""}"></span>`).join("");
  return `<div class="of-gallery">
    <div class="of-gallery-frame">
      <div class="fit-slides" data-slides>${slides}</div>
      ${arrow(-1, "chevron_left", "Previous photo", true)}
      ${arrow(1, "chevron_right", "Next photo", false)}
      <span class="fit-count" data-slide-count>1/${count}</span>
    </div>
    <div class="of-gallery-dots">${dots}</div>
  </div>`;
}

function media(fit) {
  if (fit.images.some((image) => image.generated)) return gallery(fit);
  if (fit.items.length > 1) {
    return `<div class="of-pieces">${fit.items.slice(0, 3).map((item, i) => piece(item, fit, i)).join("")}</div>`;
  }
  const [image] = fit.images;
  if (!image) return "";
  return `<div class="of-photo fit-slide"><img src="${escapeHtml(mediaUrl(image.url))}" alt="" loading="lazy" />${image.generated ? aiBadge("absolute top-3 left-3") : ""}</div>`;
}

function tally(fit) {
  const votes = fit.votes || { wear: 0, rethink: 0 };
  const total = votes.wear + votes.rethink;
  return { total, pct: total ? Math.round((votes.wear * 100) / total) : 0 };
}

function voteSummary(fit) {
  const { total, pct } = tally(fit);
  if (!total) return `<div class="of-fit-votes"><div class="of-fit-votes-row"><span class="of-fit-votes-empty">Be the first to vote</span></div></div>`;
  return `<div class="of-fit-votes">
    <div class="of-fit-votes-row"><span class="of-fit-votes-pct">${pct}% say wear it</span><span class="of-fit-votes-count">${total} vote${total === 1 ? "" : "s"}</span></div>
    <div class="of-fit-track"><div class="of-fit-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function voteButtons(fit) {
  const mine = fit.my_vote;
  const state = (choice) => `${mine === choice ? "on" : ""} ${mine && mine !== choice ? "dim" : ""}`;
  return `<div class="of-fit-buttons">
    <button type="button" class="of-fit-wear ${state("wear")}" data-fit-vote="wear" aria-pressed="${mine === "wear"}">${CHECK}Wear it</button>
    <button type="button" class="of-fit-rethink ${state("rethink")}" data-fit-vote="rethink" aria-pressed="${mine === "rethink"}">Rethink</button>
  </div>`;
}

const ARROW = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
const CHEVRON_LEFT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`;
const CHEVRON_RIGHT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;
const BOOKMARK = (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;

// Pieces with a shop link, and on your own fit, pieces that could use one (data-fit-add-link).
function shopLinks(fit, mine) {
  const chips = fit.items
    .map((item, i) => {
      const name = escapeHtml(item.name);
      if (item.url) {
        return `<a class="of-shop-chip" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><span>${name}</span>${ARROW}</a>`;
      }
      if (mine) {
        return `<button type="button" class="of-shop-chip add" data-fit-add-link="${i}" aria-label="Add a shop link for ${name}">${icons.plus}<span>${name}</span></button>`;
      }
      return "";
    })
    .filter(Boolean);
  if (!chips.length) return "";
  // The arrows stay hidden until bindShopScroll finds chips cut off on that side.
  const arrow = (step, label) => `
    <button type="button" class="of-shop-arrow ${step < 0 ? "prev" : "next"}" data-shop-step="${step}" aria-label="${label}" hidden>${step < 0 ? CHEVRON_LEFT : CHEVRON_RIGHT}</button>`;
  return `<div class="of-shop">
    <span class="of-shop-label">${icons.bag}Shop the look</span>
    <div class="of-shop-scroll">
      ${arrow(-1, "Show previous shop links")}
      <div class="of-shop-chips" data-shop-chips>${chips.join("")}</div>
      ${arrow(1, "Show more shop links")}
    </div>
  </div>`;
}

// Call once a card is created: shows each arrow only while there are chips hidden on its
// side, and scrolls the row when one is tapped.
export function bindShopScroll(card) {
  const row = card?.querySelector("[data-shop-chips]");
  if (!row) return;
  const prev = card.querySelector('[data-shop-step="-1"]');
  const next = card.querySelector('[data-shop-step="1"]');
  const sync = () => {
    const max = row.scrollWidth - row.clientWidth;
    // A few pixels of overflow (rounding, the last chip's edge) isn't worth an arrow.
    prev.hidden = row.scrollLeft <= 4;
    next.hidden = row.scrollLeft >= max - 4;
  };
  row.addEventListener("scroll", sync, { passive: true });
  // The card is usually added to the page right after this runs, so check once it's there,
  // again once the web fonts load (they widen the chips), and whenever the row or a chip
  // changes size.
  setTimeout(sync);
  document.fonts?.ready.then(sync);
  const observer = new ResizeObserver(sync);
  [row, ...row.children].forEach((el) => observer.observe(el));
  card.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shop-step]");
    if (!button) return;
    row.scrollBy({ left: Number(button.dataset.shopStep) * row.clientWidth * 0.7, behavior: "smooth" });
  });
}

// Like, comments, save and "Try this look". src/feed.js handles the clicks (data-fit-like,
// data-fit-comments, data-fit-save, data-ai-mode) and re-renders the card with the new state.
function actions(fit) {
  return `<div class="of-fit-actions">
    <div class="of-fit-action-group">
      <button type="button" class="of-fit-action ${fit.liked_by_me ? "liked" : ""}" data-fit-like aria-pressed="${Boolean(fit.liked_by_me)}" aria-label="Like">
        ${fit.liked_by_me ? icons.heart.replace('fill="none"', 'fill="currentColor"') : icons.heart}<span>${fit.like_count ?? 0}</span>
      </button>
      <button type="button" class="of-fit-action" data-fit-comments aria-label="Comments">
        ${icons.comment}<span data-comment-count>${fit.comment_count ?? 0}</span>
      </button>
      <button type="button" class="of-fit-action ${fit.saved_by_me ? "saved" : ""}" data-fit-save aria-pressed="${Boolean(fit.saved_by_me)}" aria-label="${fit.saved_by_me ? "Saved" : "Save"}">
        ${BOOKMARK(fit.saved_by_me)}
      </button>
    </div>
    <button type="button" class="of-fit-try" data-ai-mode data-fit-id="${fit.id}">
      ${icons.sparkleIcon}Try this look
    </button>
  </div>`;
}

// withActions: false where nothing handles the action buttons (e.g. the single-fit sheet).
// mine: your own fit, whose pieces without a shop link offer to add one.
export function renderFitCard(fit, { withActions = true, mine = false } = {}) {
  return `<article class="of-fitcard" data-fit-id="${fit.id}">
    ${header(fit, withActions && mine)}
    ${fit.caption ? `<h2 class="of-card-title">${escapeHtml(fit.caption)}</h2>` : ""}
    ${media(fit)}
    ${shopLinks(fit, withActions && mine)}
    ${voteSummary(fit)}
    ${voteButtons(fit)}
    ${withActions ? actions(fit) : ""}
  </article>`;
}
