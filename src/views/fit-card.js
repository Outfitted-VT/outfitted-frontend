// A posted fit, as returned by the API (see "The fit object" in the backend's docs/API.md).

import { mediaUrl } from "../fits.js";
import { escapeHtml, timeAgo } from "../format.js";

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

function header(fit) {
  const live = isLiveFit(fit) ? `<span class="of-live-tag"><span></span>LIVE</span>` : "";
  return `<div class="of-fitcard-head">
    ${live}
    <span class="of-fitcard-handle">@${escapeHtml(fit.author.username)}</span>
    <span class="of-fitcard-time">${timeAgo(fit.created_at)}</span>
  </div>`;
}

function piece(item, fit, i) {
  return `<figure class="of-piece">
    <span class="of-piece-photo" style="${crop(item, fit, i)}" role="img" aria-label="${escapeHtml(item.name)}"></span>
    <figcaption><span class="of-piece-name">${escapeHtml(item.name)}</span><span class="of-piece-color">${escapeHtml(item.color || item.brand || "")}</span></figcaption>
  </figure>`;
}

function media(fit) {
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

export function renderFitCard(fit) {
  return `<article class="of-fitcard" data-fit-id="${fit.id}">
    ${header(fit)}
    ${fit.caption ? `<h2 class="of-card-title">${escapeHtml(fit.caption)}</h2>` : ""}
    ${media(fit)}
    ${voteSummary(fit)}
    ${voteButtons(fit)}
  </article>`;
}
