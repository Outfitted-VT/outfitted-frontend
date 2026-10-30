// A posted fit, as returned by the API (see "The fit object" in the backend's docs/API.md).

import { categoryOf, mediaUrl } from "../fits.js";
import { escapeHtml, initialOf, timeAgo } from "../format.js";

export const aiBadge = (extra = "") => `
  <span class="ai-badge ${extra}" title="Generated with AI virtual try-on">
    <span class="material-symbols-outlined text-[13px]">auto_awesome</span>AI try-on
  </span>`;

function avatar(user, size = "w-10 h-10") {
  if (user.avatar) {
    return `<img class="${size} rounded-full object-cover" alt="" src="${escapeHtml(mediaUrl(user.avatar.url))}" />`;
  }
  return `<div class="${size} rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold">${escapeHtml(initialOf(user))}</div>`;
}

// Feed frames follow Instagram: the cover photo's shape, kept between portrait 4:5 and
// landscape 1.91:1. Every photo in the post fills that same frame, cropped from the center.
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;

function frameRatio(image) {
  if (!image?.width || !image?.height) return MIN_RATIO;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, image.width / image.height));
}

function photos(fit) {
  const ratio = frameRatio(fit.images[0]);
  const slides = fit.images
    .map(
      (image, i) => `
        <div class="fit-slide" style="aspect-ratio:${ratio}">
          <img class="w-full h-full object-cover" alt="Photo ${i + 1} of ${fit.images.length}" loading="lazy"
            src="${escapeHtml(mediaUrl(image.url))}" />
          ${image.generated ? aiBadge("absolute top-3 left-3") : ""}
        </div>`
    )
    .join("");
  const dots =
    fit.images.length > 1
      ? `<div class="flex justify-center gap-1.5 pt-space-xs">${fit.images
          .map((_, i) => `<span class="fit-dot ${i === 0 ? "active" : ""}"></span>`)
          .join("")}</div>`
      : "";
  return `<div class="fit-slides" data-slides>${slides}</div>${dots}`;
}

function items(fit) {
  if (!fit.items.length) return "";
  return `
    <div class="flex flex-col gap-space-2xs">
      <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-semibold">In this fit</span>
      <div class="flex gap-space-xs overflow-x-auto -mx-space-md px-space-md pb-1">
        ${fit.items
          .map((item) => {
            const category = categoryOf(item.category);
            const detail = [item.brand, item.color, item.material].filter(Boolean).map(escapeHtml).join(" · ");
            const tag = item.url ? "a" : "div";
            const link = item.url ? `href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"` : "";
            return `
              <${tag} ${link} class="flex-shrink-0 flex items-center gap-space-xs bg-surface-container-low rounded-DEFAULT pl-1.5 pr-space-sm py-1.5 max-w-[220px]">
                <span class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                  <span class="material-symbols-outlined text-[17px]">${category.icon}</span>
                </span>
                <span class="flex flex-col min-w-0">
                  <span class="font-label-md text-label-md text-on-surface font-semibold truncate first-letter:uppercase">${escapeHtml(item.name)}</span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant font-normal truncate">${detail || category.label}</span>
                </span>
                ${item.url ? `<span class="flex-shrink-0 inline-flex items-center gap-0.5 pl-1 font-label-sm text-label-sm text-secondary font-semibold">Shop<span class="material-symbols-outlined text-[14px]">north_east</span></span>` : ""}
              </${tag}>`;
          })
          .join("")}
      </div>
    </div>`;
}

function tags(fit) {
  const all = [...(fit.occasion_tags || []), ...(fit.style_tags || [])];
  if (!all.length) return "";
  return `
    <div class="flex flex-wrap gap-1.5">
      ${[...new Set(all)]
        .map((tag) => `<span class="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">#${escapeHtml(tag)}</span>`)
        .join("")}
    </div>`;
}

const filled = (on) => `font-variation-settings:'FILL' ${on ? 1 : 0}`;

export function renderFitCard(fit, { mine = false } = {}) {
  const name = fit.author.full_name || fit.author.username;
  return `
    <article class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm" data-fit-id="${fit.id}">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-space-xs min-w-0">
          ${avatar(fit.author)}
          <div class="flex flex-col min-w-0">
            <span class="font-title-ui text-label-md text-on-surface font-semibold truncate">${escapeHtml(name)}</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant font-normal truncate">@${escapeHtml(fit.author.username)} · ${timeAgo(fit.created_at)}</span>
          </div>
        </div>
        ${
          mine
            ? `<button class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors" data-fit-delete aria-label="Delete fit">
                 <span class="material-symbols-outlined text-[20px]">delete</span>
               </button>`
            : ""
        }
      </header>

      <div class="-mx-space-md">${photos(fit)}</div>

      ${fit.caption ? `<p class="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">${escapeHtml(fit.caption)}</p>` : ""}

      ${tags(fit)}

      ${items(fit)}

      <footer class="flex items-center justify-between pt-space-2xs border-t border-surface-container-high">
        <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors pt-space-xs" data-fit-like aria-pressed="${fit.liked_by_me}">
          <span class="material-symbols-outlined text-[22px] ${fit.liked_by_me ? "text-error" : ""}" style="${filled(fit.liked_by_me)}">favorite</span>
          <span class="font-label-md text-label-md font-semibold" data-like-count>${fit.like_count}</span>
        </button>
        <button type="button" class="flex items-center gap-1 text-secondary bg-secondary-fixed/50 hover:bg-secondary hover:text-on-secondary px-3 py-1 rounded-full transition-all pt-space-xs font-label-md text-label-md font-semibold active:scale-95 shadow-sm" data-steal-swap-fit="${escapeHtml(fit.id)}">
          <span class="material-symbols-outlined text-[17px]">compare</span>
          <span>Steal & Swap</span>
        </button>
        <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors pt-space-xs" data-fit-save aria-pressed="${fit.saved_by_me}">
          <span class="material-symbols-outlined text-[22px]" style="${filled(fit.saved_by_me)}">bookmark</span>
          <span class="font-label-md text-label-md">${fit.saved_by_me ? "Saved" : "Save"}</span>
        </button>
      </footer>
    </article>`;
}
