// One piece of a fit (a shoe, a sweater), opened from its shop chip or its photo on a fit card:
// a small bubble next to it with the piece, a link to the shop, and Save piece. Saved pieces
// show in My fits (src/wardrobe.js, Pieces). Styles: .of-piece-pop in src/connected.css.

import { mediaUrl, savePiece, unsavePiece } from "../fits.js";
import { escapeHtml } from "../format.js";
import { pieceStyle } from "./fit-card.js";

const CATEGORY = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bag: "Bag",
  accessory: "Accessory",
  hat: "Hat",
};

const BOOKMARK = (on) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;
const OUT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>`;

export const categoryLabel = (category) => CATEGORY[category] || "Piece";

export function shopHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// A saved piece's photo: its fit photo, zoomed on the pin when several pieces shared it (the
// same look as on the fit card).
export function savedPieceStyle(piece) {
  if (!piece.photo) return "";
  const url = `background-image:url('${escapeHtml(mediaUrl(piece.photo.url))}');`;
  if (piece.zoom && piece.pin) {
    return `${url}background-position:${Math.round(piece.pin.x * 100)}% ${Math.round(piece.pin.y * 100)}%;background-size:260%;`;
  }
  return `${url}background-position:center;`;
}

function saveButton(saved) {
  return `<button type="button" class="of-piece-pop-save ${saved ? "on" : ""}" data-piece-save aria-pressed="${saved}">${BOOKMARK(saved)}<span>${saved ? "Saved" : "Save piece"}</span></button>`;
}

// The open bubble, if any (one at a time).
let openBubble = null;

// Place the bubble above the tapped chip or photo (below it when there's no room), its tail
// pointing at it, kept on screen.
function place(pop, anchor) {
  const margin = 12;
  const width = pop.offsetWidth;
  const height = pop.offsetHeight;
  const rect = anchor?.isConnected ? anchor.getBoundingClientRect() : null;
  if (!rect) {
    pop.style.left = `${Math.max(margin, (innerWidth - width) / 2)}px`;
    pop.style.top = `${Math.max(margin, (innerHeight - height) / 2)}px`;
    pop.dataset.side = "none";
    return;
  }
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(margin, center - width / 2), innerWidth - width - margin);
  const above = rect.top - height - 14 >= margin;
  pop.style.left = `${left}px`;
  pop.style.top = `${above ? rect.top - height - 12 : rect.bottom + 12}px`;
  pop.dataset.side = above ? "above" : "below";
  pop.style.setProperty("--tail-x", `${Math.min(Math.max(20, center - left), width - 20)}px`);
}

// A small bubble next to the piece: thumbnail, name, details, Shop and Save. fit: the fit (as
// from the API); index: which of fit.items; anchor: the chip or photo that was tapped.
// onChange(fit) gets the fit with that item's saved_piece_id updated.
export function openPieceSheet({ fit, index, toast, onChange, anchor }) {
  openBubble?.close();
  let current = fit;
  const item = () => current.items[index];
  const it = item();
  if (!it) return;
  const host = it.url ? shopHost(it.url) : "";
  const details = [it.brand, it.color].filter(Boolean).map(escapeHtml).join(" · ");
  const pop = document.createElement("div");
  pop.className = "of-piece-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", it.name);
  pop.innerHTML = `
    <div class="of-piece-pop-row">
      <span class="of-piece-pop-photo" style="${pieceStyle(it, current, index)}" aria-hidden="true"></span>
      <div class="of-piece-pop-text">
        <span class="of-piece-pop-kicker">${escapeHtml(categoryLabel(it.category))}${host ? ` · ${escapeHtml(host)}` : ""}</span>
        <b>${escapeHtml(it.name)}</b>
        ${details ? `<small>${details}</small>` : ""}
      </div>
    </div>
    <div class="of-piece-pop-actions">
      ${
        it.url
          ? `<a class="of-piece-pop-shop" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${OUT}<span>Shop</span></a>`
          : `<button type="button" class="of-piece-pop-shop" disabled title="The poster didn't add a shop link">${OUT}<span>No shop link</span></button>`
      }
      <span data-piece-save-slot>${saveButton(Boolean(it.saved_piece_id))}</span>
    </div>`;
  document.body.append(pop);
  place(pop, anchor);

  const onDown = (event) => {
    if (!pop.contains(event.target) && !anchor?.contains(event.target)) close();
  };
  const onKey = (event) => event.key === "Escape" && close();
  const onMove = () => close();
  function close() {
    if (openBubble?.pop !== pop) return;
    openBubble = null;
    document.removeEventListener("pointerdown", onDown, true);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onMove, true);
    window.removeEventListener("resize", onMove);
    pop.classList.add("out");
    setTimeout(() => pop.remove(), 150);
  }
  openBubble = { pop, close };
  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onMove, true);
  window.addEventListener("resize", onMove);

  const slot = pop.querySelector("[data-piece-save-slot]");
  let busy = false;
  slot.addEventListener("click", async (event) => {
    if (!event.target.closest("[data-piece-save]") || busy) return;
    busy = true;
    const before = item().saved_piece_id || null;
    const update = (savedId) => {
      current = { ...current, items: current.items.map((x, i) => (i === index ? { ...x, saved_piece_id: savedId } : x)) };
      slot.innerHTML = saveButton(Boolean(savedId));
    };
    try {
      if (before) {
        update(null);
        await unsavePiece(before);
        toast?.("Removed from saved pieces");
      } else {
        update("saving");
        const piece = await savePiece(current.id, item().id);
        update(piece.id);
        toast?.("Piece saved to My fits");
      }
      onChange?.(current);
    } catch (err) {
      update(before);
      toast?.(err.message || "Couldn't update. Try again.");
    } finally {
      busy = false;
    }
  });
}
