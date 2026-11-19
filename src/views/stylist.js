// Style a Friend, the stylist's side: answer a "Style me" request from the chat. Build a look
// from your saved pieces, your saved fits, or new photos; give each piece a shop link; preview it
// on your friend's photo (an AI try-on, when they sent one); and send it back as a styled_look
// message. The backend copies the pieces into the message (app/services/styling.py).

import { CATEGORIES, createTryOn, listFits, listSavedPieces, mediaUrl, uploadImage } from "../fits.js";
import { escapeHtml } from "../format.js";
import * as messages from "../messages-store.js";
import { avatar, displayName, ofIcons } from "./components.js";
import { pieceStyle } from "./fit-card.js";
import { savedPieceStyle } from "./piece-sheet.js";
import { openSheet } from "./sheet.js";

const MAX_PIECES = 12;
const NOTE_MAX = 2000;

// Where each kind of piece goes on the body for a try-on (app/schemas/tryon.py PieceSlot).
const SLOT_FOR = {
  top: "top",
  bottom: "bottom",
  dress: "one_piece",
  outerwear: "outerwear",
  shoes: "feet",
  headwear: "head",
  bag: "accessory",
  accessory: "accessory",
  jewelry: "accessory",
  other: "accessory",
};

const TABS = [
  ["pieces", "Saved pieces"],
  ["fits", "Saved fits"],
  ["upload", "Upload"],
];

const firstName = (user) => displayName(user).split(/\s+/)[0];

// A link typed without https:// still works.
function cleanUrl(value) {
  const url = (value || "").trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function fitPhotoFor(item, fit, index) {
  return item.image || fit.images.find((i) => i.id === item.pin?.image_id) || fit.images[index] || fit.images[0] || null;
}

// --- Turning each source into a piece of the look ---------------------------------------------

function fromSavedPiece(piece) {
  return {
    key: `saved:${piece.id}`,
    source: { saved_piece_id: piece.id },
    category: piece.category,
    name: piece.name,
    brand: piece.brand,
    color: piece.color,
    url: piece.url || "",
    style: savedPieceStyle(piece),
    imageId: piece.photo?.id || null,
    preview: { photo: piece.photo, zoom: piece.zoom, pin: piece.pin },
  };
}

function fromFitItem(fit, item, index) {
  const photo = fitPhotoFor(item, fit, index);
  const shared = !item.image && Boolean(item.pin) && fit.items.filter((o) => o.pin?.image_id === item.pin.image_id).length > 1;
  return {
    key: `fit:${fit.id}:${item.id}`,
    source: { fit_id: fit.id, item_id: item.id },
    category: item.category,
    name: item.name,
    brand: item.brand,
    color: item.color,
    url: item.url || "",
    style: pieceStyle(item, fit, index),
    imageId: photo?.id || null,
    preview: { photo, zoom: shared, pin: shared ? { x: item.pin.x, y: item.pin.y } : null },
  };
}

function fromUpload(image, name, category) {
  return {
    key: `upload:${image.id}`,
    source: { image_id: image.id, name, category },
    category,
    name,
    brand: null,
    color: null,
    url: "",
    style: `background-image:url('${escapeHtml(mediaUrl(image.url))}');background-position:center;`,
    imageId: image.id,
    preview: { photo: image, zoom: false, pin: null },
  };
}

// --- Drawing ---------------------------------------------------------------------------------

function briefHtml(state) {
  const { request } = state;
  const photo = state.tryon?.result_image || request.payload?.image;
  const tag = state.tryon ? `<span class="of-stylist-tag">${ofIcons.sparkle(14)}AI try-on</span>` : "";
  return `<div class="of-stylist-brief">
    ${photo ? `<div class="of-stylist-photo"><img src="${escapeHtml(mediaUrl(photo.url))}" alt="" />${tag}</div>` : ""}
    <div class="of-stylist-ask">
      <span class="of-stylist-who">${avatar(request.sender, { size: 32 })}<b>${escapeHtml(firstName(request.sender))} asked</b></span>
      <p>${escapeHtml(request.body || "Put a look together for me")}</p>
      ${photo ? "" : `<small>No photo sent, so this look can't be tried on them.</small>`}
    </div>
  </div>`;
}

function trayHtml(state) {
  if (!state.look.length) return `<p class="of-stylist-empty">Pick pieces below to build the look.</p>`;
  return state.look
    .map(
      (piece, i) => `<div class="of-stylist-piece">
        <span class="of-stylist-thumb" style="${piece.style}"></span>
        <span class="of-stylist-piece-text">
          <b>${escapeHtml(piece.name)}</b>
          <input type="url" inputmode="url" class="of-stylist-link" data-look-url="${i}" maxlength="2048"
            placeholder="Shop link (optional)" value="${escapeHtml(piece.url)}" autocomplete="off" />
        </span>
        <button type="button" class="of-stylist-remove" data-look-remove="${i}" aria-label="Remove ${escapeHtml(piece.name)}">${ofIcons.close(16)}</button>
      </div>`
    )
    .join("");
}

const inLook = (state, key) => state.look.some((piece) => piece.key === key);

function tile({ key, style, name, detail }, state) {
  const on = inLook(state, key);
  return `<button type="button" class="of-stylist-tile ${on ? "on" : ""}" data-pick="${escapeHtml(key)}" aria-pressed="${on}">
    <span class="of-stylist-tile-photo" style="${style}">${on ? `<i>${ofIcons.check(14)}</i>` : ""}</span>
    <b>${escapeHtml(name)}</b>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
  </button>`;
}

function piecesTab(state) {
  if (state.saved === null) return `<p class="of-muted">Loading your saved pieces…</p>`;
  if (!state.saved.length) return `<p class="of-muted">No saved pieces yet. Save pieces from fits with the bookmark on each piece.</p>`;
  return `<div class="of-stylist-grid">${state.saved
    .map((piece) => {
      const option = fromSavedPiece(piece);
      state.options.set(option.key, option);
      return tile({ ...option, detail: piece.brand || (piece.source_username ? `@${piece.source_username}` : "") }, state);
    })
    .join("")}</div>`;
}

function fitsTab(state) {
  if (state.fits === null) return `<p class="of-muted">Loading your saved fits…</p>`;
  const fits = state.fits.filter((fit) => fit.items?.length);
  if (!fits.length) return `<p class="of-muted">No saved fits with tagged pieces yet.</p>`;
  return fits
    .map((fit) => {
      const tiles = fit.items
        .map((item, index) => {
          const option = fromFitItem(fit, item, index);
          state.options.set(option.key, option);
          return tile({ ...option, detail: item.brand || "" }, state);
        })
        .join("");
      return `<div class="of-stylist-fit">
        <p class="of-stylist-fit-head">@${escapeHtml(fit.author?.username || "")}${fit.caption ? ` · ${escapeHtml(fit.caption.split("\n")[0])}` : ""}</p>
        <div class="of-stylist-grid">${tiles}</div>
      </div>`;
    })
    .join("");
}

function uploadTab(state) {
  const { upload } = state;
  if (!upload) {
    return `<button type="button" class="of-photo-pick of-stylist-upload" data-upload-pick>${ofIcons.image(24)}<span>Add a photo of a piece</span></button>`;
  }
  const options = CATEGORIES.map((c) => `<option value="${c.id}" ${upload.category === c.id ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("");
  return `<div class="of-stylist-new">
    <span class="of-stylist-thumb big" style="background-image:url('${escapeHtml(upload.previewUrl)}');background-position:center;"></span>
    <div class="of-stylist-new-fields">
      <input class="of-field" data-upload-name maxlength="100" placeholder="What is it? (e.g. Black loafers)" value="${escapeHtml(upload.name)}" />
      <select class="of-field" data-upload-category aria-label="Kind of piece">${options}</select>
      <div class="of-stylist-new-actions">
        <button type="button" class="of-btn of-btn-soft" data-upload-cancel>Cancel</button>
        <button type="button" class="of-btn of-btn-ink" data-upload-add ${upload.image ? "" : "disabled"}>${upload.image ? "Add to look" : "Uploading…"}</button>
      </div>
    </div>
  </div>`;
}

function sourcesHtml(state) {
  const tabs = TABS.map(
    ([id, label]) => `<button type="button" role="tab" class="of-stylist-tab ${state.tab === id ? "on" : ""}" data-stylist-tab="${id}" aria-selected="${state.tab === id}">${label}</button>`
  ).join("");
  const body = state.tab === "pieces" ? piecesTab(state) : state.tab === "fits" ? fitsTab(state) : uploadTab(state);
  return `<div class="of-stylist-tabs" role="tablist">${tabs}</div><div class="of-stylist-source">${body}</div>`;
}

function bodyHtml(state) {
  const canTry = Boolean(state.request.payload?.image);
  return `<div class="of-sheet-body of-stylist-body">
      <div data-stylist-brief>${briefHtml(state)}</div>
      <p class="of-inbox-label">The look <span data-look-count>${state.look.length ? `(${state.look.length})` : ""}</span></p>
      <div class="of-stylist-tray" data-stylist-tray>${trayHtml(state)}</div>
      <div data-stylist-sources>${sourcesHtml(state)}</div>
      <label class="of-field-label">Your note
        <textarea class="of-field of-stylist-note" data-stylist-note rows="2" maxlength="${NOTE_MAX}" placeholder="Tuck the tee, roll the jeans once…"></textarea>
      </label>
    </div>
    <p class="of-toast-error" data-error hidden></p>
    <div class="of-stylist-actions">
      ${canTry ? `<button type="button" class="of-btn of-btn-soft" data-stylist-try>${ofIcons.sparkle(18)}<span>Try on ${escapeHtml(firstName(state.request.sender))}</span></button>` : ""}
      <button type="button" class="of-btn of-btn-ink" data-stylist-send>Send look</button>
    </div>`;
}

// --- The try-on preview ----------------------------------------------------------------------

// One photo per body slot, each photo once; a dress can't go with a top or bottom.
function tryOnPieces(look) {
  const used = new Set();
  const slots = new Map();
  for (const piece of look) {
    const slot = SLOT_FOR[piece.category] || "accessory";
    if (!piece.imageId || used.has(piece.imageId) || slots.has(slot)) continue;
    used.add(piece.imageId);
    slots.set(slot, { slot, imageId: piece.imageId });
  }
  if (slots.has("one_piece") && (slots.has("top") || slots.has("bottom"))) slots.delete("one_piece");
  return [...slots.values()];
}

// --- Opening it ------------------------------------------------------------------------------

// request: the style_request message. toast(text) for errors and confirmations.
export function openStylist({ request, toast = () => {} }) {
  const state = {
    request,
    tab: "pieces",
    saved: null,
    fits: null,
    upload: null,
    look: [],
    options: new Map(),
    tryon: null,
    trying: false,
  };
  const { root, close } = openSheet({ title: `Style ${firstName(request.sender)}`, body: bodyHtml(state) });
  root.classList.add("of-stylist");
  const $ = (selector) => root.querySelector(selector);
  const error = $("[data-error]");
  const showError = (problem) => {
    error.hidden = !problem;
    error.textContent = problem || "";
  };

  const paintTray = () => {
    $("[data-stylist-tray]").innerHTML = trayHtml(state);
    $("[data-look-count]").textContent = state.look.length ? `(${state.look.length})` : "";
  };
  const paintSources = () => ($("[data-stylist-sources]").innerHTML = sourcesHtml(state));
  const paintBrief = () => ($("[data-stylist-brief]").innerHTML = briefHtml(state));
  // A different look makes the old try-on stale.
  const lookChanged = () => {
    if (state.tryon) {
      state.tryon = null;
      paintBrief();
    }
    paintTray();
    paintSources();
  };

  listSavedPieces()
    .then((page) => (state.saved = page.items))
    .catch(() => (state.saved = []))
    .finally(paintSources);
  listFits("/users/me/saved", null, 20)
    .then((page) => (state.fits = page.items))
    .catch(() => (state.fits = []))
    .finally(paintSources);

  function toggle(key) {
    const at = state.look.findIndex((piece) => piece.key === key);
    if (at !== -1) state.look.splice(at, 1);
    else if (state.look.length >= MAX_PIECES) return showError(`A look can have up to ${MAX_PIECES} pieces.`);
    else state.look.push({ ...state.options.get(key) });
    showError("");
    lookChanged();
  }

  async function pickUpload(file) {
    state.upload = { file, previewUrl: URL.createObjectURL(file), name: "", category: "top", image: null };
    paintSources();
    try {
      const image = await uploadImage(file);
      if (state.upload?.file === file) {
        state.upload.image = image;
        paintSources();
      }
    } catch (err) {
      state.upload = null;
      paintSources();
      showError(err.message || "Couldn't upload that photo.");
    }
  }

  function addUpload() {
    const { upload } = state;
    const name = $("[data-upload-name]").value.trim();
    if (!upload?.image) return;
    if (!name) return showError("Name the piece first.");
    if (state.look.length >= MAX_PIECES) return showError(`A look can have up to ${MAX_PIECES} pieces.`);
    state.look.push(fromUpload(upload.image, name, $("[data-upload-category]").value));
    state.upload = null;
    showError("");
    lookChanged();
  }

  async function tryOn() {
    if (state.trying) return;
    const pieces = tryOnPieces(state.look);
    if (!pieces.length) return showError("Add pieces with photos to try the look on.");
    state.trying = true;
    showError("");
    const button = $("[data-stylist-try]");
    button.disabled = true;
    button.querySelector("span").textContent = "Trying it on…";
    try {
      state.tryon = await createTryOn(request.payload.image.id, { pieces, styleRequestId: request.id });
      paintBrief();
      $("[data-stylist-brief]").scrollIntoView({ behavior: "smooth", block: "nearest" });
      const skipped = state.look.length - pieces.length;
      if (skipped > 0) toast(`The try-on used ${pieces.length} of ${state.look.length} pieces (one per spot on the body).`);
    } catch (err) {
      showError(err.message || "Couldn't try the look on. Send it without the try-on, or try again.");
    } finally {
      state.trying = false;
      button.disabled = false;
      button.querySelector("span").textContent = `Try on ${firstName(request.sender)}`;
    }
  }

  function send() {
    if (!state.look.length) return showError("Add at least one piece to the look.");
    const bad = state.look.find((piece) => piece.url && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(cleanUrl(piece.url)));
    if (bad) return showError(`Check the link for ${bad.name}.`);
    const pieces = state.look.map((piece) => ({ ...piece.source, ...(cleanUrl(piece.url) && { url: cleanUrl(piece.url) }) }));
    const preview = {
      request_id: request.id,
      tryon_image: state.tryon?.result_image || null,
      pieces: state.look.map((piece) => ({
        category: piece.category,
        name: piece.name,
        brand: piece.brand,
        color: piece.color,
        url: cleanUrl(piece.url),
        ...piece.preview,
        saved_piece_id: null,
      })),
    };
    messages.sendDraft(request.conversation_id, {
      kind: "styled_look",
      body: $("[data-stylist-note]").value.trim() || null,
      requestId: request.id,
      look: { pieces, tryon_id: state.tryon?.id || null },
      preview,
    });
    close();
    toast(`Look sent to ${firstName(request.sender)}`);
  }

  root.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-stylist-tab]");
    if (tab) {
      state.tab = tab.dataset.stylistTab;
      return paintSources();
    }
    const pick = event.target.closest("[data-pick]");
    if (pick) return toggle(pick.dataset.pick);
    const remove = event.target.closest("[data-look-remove]");
    if (remove) {
      state.look.splice(Number(remove.dataset.lookRemove), 1);
      return lookChanged();
    }
    if (event.target.closest("[data-upload-pick]")) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", () => input.files?.[0] && pickUpload(input.files[0]));
      return input.click();
    }
    if (event.target.closest("[data-upload-cancel]")) {
      state.upload = null;
      return paintSources();
    }
    if (event.target.closest("[data-upload-add]")) return addUpload();
    if (event.target.closest("[data-stylist-try]")) return tryOn();
    if (event.target.closest("[data-stylist-send]")) send();
  });
  root.addEventListener("input", (event) => {
    const link = event.target.closest("[data-look-url]");
    if (link) state.look[Number(link.dataset.lookUrl)].url = link.value;
    if (event.target.matches("[data-upload-name]") && state.upload) state.upload.name = event.target.value;
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-upload-category]") && state.upload) state.upload.category = event.target.value;
  });
}
