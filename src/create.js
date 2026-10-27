// Behaviour for the "+" sheet (markup in src/views/create-sheet.js): posting a fit, and AI try-on.

import { ApiError } from "./auth.js";
import { currentUser } from "./data.js";
import { categoryOf, createFit, createTryOn, detectPieces, mediaUrl, uploadImage } from "./fits.js";
import { escapeHtml } from "./format.js";
import { aiBadge } from "./views/fit-card.js";

const MAX_PHOTOS = 10;
const TRYON_STEPS = ["Uploading your photos…", "Reading the outfit…", "Dressing you…", "Finishing the details…"];

const TRYON_INTRO = {
  outfit: "Pick a photo of you and a photo of the outfit. We'll put the outfit on you.",
  pieces: "Mix pieces from different photos. Add only what you want to change; the rest of your look stays as it is.",
};
// Piece slots head to toe, matching the backend. A dress (one_piece) replaces the top and
// bottom, so it can't be combined with them.
const PIECE_SLOTS = ["head", "top", "outerwear", "one_piece", "bottom", "feet", "accessory"];
const CONFLICTS = { one_piece: ["top", "bottom"], top: ["one_piece"], bottom: ["one_piece"] };

const SCREENS = {
  menu: { kicker: "Create", title: "What are we doing?" },
  compose: { kicker: "New fit", title: "Post a fit", back: "menu" },
  tryon: { kicker: "AI try-on", title: "Try it on", back: "menu" },
  "tryon-loading": { kicker: "AI try-on", title: "Working on it" },
  "tryon-result": { kicker: "AI try-on", title: "Here's your look", back: "tryon" },
};

let state;
let hooks = { onPosted: () => {}, toast: () => {} };
const $ = (selector) => document.querySelector(selector);

function freshState() {
  return {
    screen: "menu",
    // Each photo is a local file not uploaded yet ({ file, preview }) or an uploaded image ({ image }).
    photos: [],
    // Pieces in the shape POST /fits takes, plus `auto` for untouched suggestions.
    items: [],
    tags: { occasion: [], style: [] },
    category: "top",
    editing: null, // index of the piece open in the editor, or null when adding
    detect: { cover: null, run: 0, status: "idle", found: 0 },
    // mode is "outfit" (one photo of a whole fit) or "pieces" (a photo per slot in `pieces`).
    tryon: { mode: "outfit", person: null, outfit: null, pieces: {}, result: null, run: 0 },
  };
}

// --- remembering the person photo between try-ons ---------------------------------------

const personKey = () => `outfitted.tryon.person.${currentUser.username}`;

function rememberedPerson() {
  try {
    const image = JSON.parse(localStorage.getItem(personKey()));
    return image?.id ? { image, preview: mediaUrl(image.url), remembered: true } : null;
  } catch {
    return null;
  }
}

function rememberPerson(image) {
  try {
    localStorage.setItem(personKey(), JSON.stringify(image));
  } catch {
    // Storage can be unavailable; the user just picks the photo again next time.
  }
}

function forgetPerson() {
  try {
    localStorage.removeItem(personKey());
  } catch {}
}

// --- sheet -----------------------------------------------------------------------------

function closeOnEscape(e) {
  if (e.key === "Escape" && !$("#create-backdrop").classList.contains("hidden")) closeCreate();
}

export function openCreate(screen = "menu") {
  state = freshState();
  const sheet = $("#create-sheet");
  $("#create-backdrop").classList.remove("hidden");
  show(screen);
  void sheet.offsetHeight; // lay out the hidden position first, so the slide-up animates
  sheet.classList.remove("translate-y-full");
}

function closeCreate() {
  // Ignore a try-on or detection that finishes after closing.
  state.tryon.run++;
  state.detect.run++;
  $("#create-sheet").classList.add("translate-y-full");
  setTimeout(() => {
    $("#create-backdrop").classList.add("hidden");
    revokePreviews();
    state = freshState();
    setItemEditorOpen(false);
    renderCompose();
    $("#compose-caption").value = "";
  }, 280);
}

function revokePreviews() {
  const t = state.tryon;
  const local = [...state.photos, t.person, t.outfit, ...Object.values(t.pieces)].filter((p) => p?.file);
  local.forEach((p) => URL.revokeObjectURL(p.preview));
}

function show(screen) {
  state.screen = screen;
  document.querySelectorAll("#create-sheet [data-screen]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.screen !== screen);
  });
  const meta = SCREENS[screen];
  $("#create-kicker").textContent = meta.kicker;
  $("#create-title").textContent = meta.title;
  $("#create-back").classList.toggle("invisible", !meta.back);
  $("#create-sheet").scrollTop = 0;
  if (screen === "compose") renderCompose();
  if (screen === "tryon") renderTryOn();
}

function showError(id, message) {
  const el = $(id);
  el.textContent = message || "";
  el.classList.toggle("hidden", !message);
}

const errorMessage = (err) =>
  err instanceof ApiError ? err.message : "Something went wrong. Please try again.";

const pickFiles = (input) =>
  new Promise((resolve) => {
    input.value = "";
    input.onchange = () => resolve([...input.files]);
    input.click();
  });

// --- compose ---------------------------------------------------------------------------

function renderCompose() {
  renderPhotos();
  renderItems();
  renderTags();
  renderDetectStatus();
  updateCaptionCount();
  showError("#compose-error");
}

function renderPhotos() {
  const tiles = state.photos.map((photo, i) => {
    const src = photo.preview || mediaUrl(photo.image.url);
    return `
      <div class="relative flex-shrink-0 w-24 h-32 rounded-DEFAULT overflow-hidden bg-surface-container-high">
        <img class="w-full h-full object-cover" alt="Photo ${i + 1}" src="${escapeHtml(src)}" />
        ${photo.image?.generated ? aiBadge("absolute bottom-1.5 left-1.5 scale-90 origin-bottom-left") : ""}
        <button type="button" data-photo-remove="${i}" aria-label="Remove photo ${i + 1}"
          class="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
        ${i === 0 ? `<span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-white/85 text-[#1a1c1b] font-micro-mono text-[9px] uppercase font-bold">Cover</span>` : ""}
      </div>`;
  });
  if (state.photos.length < MAX_PHOTOS) {
    tiles.push(`
      <button type="button" id="compose-add-photo"
        class="flex-shrink-0 w-24 h-32 rounded-DEFAULT border border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center gap-1 text-on-surface-variant active:scale-95 transition-transform">
        <span class="material-symbols-outlined text-[26px] text-secondary">add_a_photo</span>
        <span class="font-label-sm text-label-sm">${state.photos.length ? "Add more" : "Add photos"}</span>
      </button>`);
  }
  $("#compose-photos").innerHTML = tiles.join("");
  $("#compose-photo-count").textContent = `${state.photos.length} / ${MAX_PHOTOS}`;
  $("#compose-submit").disabled = state.photos.length === 0;

  $("#compose-add-photo")?.addEventListener("click", async () => {
    const files = await pickFiles($("#compose-file"));
    const room = MAX_PHOTOS - state.photos.length;
    files.slice(0, room).forEach((file) => state.photos.push({ file, preview: URL.createObjectURL(file) }));
    if (files.length > room) hooks.toast(`Only ${MAX_PHOTOS} photos per fit`);
    renderPhotos();
  });
  document.querySelectorAll("[data-photo-remove]").forEach((button) => {
    button.onclick = () => {
      const [removed] = state.photos.splice(Number(button.dataset.photoRemove), 1);
      if (removed.file) URL.revokeObjectURL(removed.preview);
      renderPhotos();
    };
  });
  detectCover();
}

// --- automatic piece detection on the cover photo ---

// Suggestions are marked `auto` until the user edits them; a new cover replaces only those.
async function detectCover() {
  const d = state.detect;
  const cover = state.photos[0] || null;
  if (cover === d.cover) return;
  d.cover = cover;
  const run = ++d.run;
  const stale = () => run !== d.run;

  if (!cover) {
    dropSuggestions();
    d.status = "idle";
    renderDetectStatus();
    return;
  }
  d.status = "running";
  renderDetectStatus();
  try {
    // Uploading the cover now also means posting won't upload it again.
    if (!cover.image) cover.image = await uploadImage(cover.file);
    if (stale()) return;
    const result = await detectPieces(cover.image.id);
    if (stale()) return;
    dropSuggestions();
    state.items.push(...result.items.map((item) => ({ ...item, auto: true })));
    addTags("occasion", result.occasion_tags, true);
    addTags("style", result.style_tags, true);
    d.status = "done";
    d.found = result.items.length;
  } catch (err) {
    if (stale()) return;
    console.error(err);
    d.status = "failed";
  }
  renderItems();
  renderTags();
  renderDetectStatus();
}

function dropSuggestions() {
  state.items = state.items.filter((item) => !item.auto);
  for (const kind of ["occasion", "style"]) {
    state.tags[kind] = state.tags[kind].filter((tag) => !tag.auto);
  }
  renderItems();
  renderTags();
}

function renderDetectStatus() {
  const d = state.detect;
  const messages = {
    idle: ["photo_camera", "Add a photo and we'll tag the pieces for you."],
    running: ["progress_activity", "Finding the pieces and similar products…"],
    done: d.found
      ? ["auto_awesome", `Found ${d.found} piece${d.found === 1 ? "" : "s"}. Tap one to edit it.`]
      : ["auto_awesome", "We couldn't spot any pieces. Add them yourself."],
    failed: ["info", "Couldn't detect the pieces right now. Add them yourself."],
  };
  const [icon, text] = messages[d.status];
  $("#compose-detect").innerHTML = `
    <span class="material-symbols-outlined text-[16px] ${d.status === "running" ? "animate-spin" : "text-secondary"}">${icon}</span>
    <span>${text}</span>`;
}

// --- pieces ---

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// Similar products for a detected piece; the selected one is the piece's shop link.
function matchStrip(item, i) {
  const matches = item.matches || [];
  if (!matches.length) return "";
  return `
    <div class="flex flex-col gap-1 pl-space-xs">
      <span class="font-label-sm text-label-sm text-on-surface-variant font-normal">Shop similar · tap to choose, tap again to remove</span>
      <div class="flex gap-space-xs overflow-x-auto -mx-margin px-margin pb-1">
        ${matches
          .map((match, m) => {
            const selected = item.url === match.link;
            return `
              <button type="button" data-match="${i}:${m}" aria-pressed="${selected}"
                class="match-card flex-shrink-0 w-36 flex items-center gap-1.5 p-1.5 rounded-DEFAULT text-left border transition-colors">
                <span class="w-11 h-11 rounded bg-surface-container-high overflow-hidden flex-shrink-0">
                  ${match.thumbnail ? `<img class="w-full h-full object-cover" alt="" loading="lazy" referrerpolicy="no-referrer" src="${escapeHtml(match.thumbnail)}" />` : ""}
                </span>
                <span class="flex flex-col min-w-0">
                  <span class="font-label-sm text-label-sm text-on-surface font-semibold truncate">${escapeHtml(match.source || hostOf(match.link))}</span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant font-normal truncate">${escapeHtml(match.price || match.title)}</span>
                </span>
              </button>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderItems() {
  $("#compose-items").innerHTML = state.items
    .map((item, i) => {
      const category = categoryOf(item.category);
      const detail = [item.brand, item.color, item.material].filter(Boolean).map(escapeHtml).join(" · ");
      const link = item.url
        ? `<span class="inline-flex items-center gap-0.5 text-secondary font-semibold"><span class="material-symbols-outlined text-[13px]">link</span>${escapeHtml(hostOf(item.url))}</span>`
        : "";
      return `
       <div class="flex flex-col gap-space-xs">
        <div class="flex items-center gap-space-sm bg-surface-container-low rounded-DEFAULT p-space-xs pr-1">
          <button type="button" data-item-edit="${i}" class="flex items-center gap-space-sm min-w-0 flex-1 text-left" aria-label="Edit ${escapeHtml(item.name)}">
            <span class="relative w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant flex-shrink-0">
              <span class="material-symbols-outlined text-[20px]">${category.icon}</span>
              ${item.auto ? `<span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center" title="Detected automatically"><span class="material-symbols-outlined text-[11px] text-tertiary-fixed" style="font-variation-settings:'FILL' 1">auto_awesome</span></span>` : ""}
            </span>
            <span class="flex flex-col min-w-0 flex-1">
              <span class="font-label-md text-label-md text-on-surface font-semibold truncate first-letter:uppercase">${escapeHtml(item.name)}</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant font-normal truncate">${category.label}${detail ? ` · ${detail}` : ""}</span>
              ${link ? `<span class="font-label-sm text-label-sm truncate">${link}</span>` : ""}
            </span>
          </button>
          <button type="button" data-item-remove="${i}" aria-label="Remove ${escapeHtml(item.name)}"
            class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        ${matchStrip(item, i)}
       </div>`;
    })
    .join("");
  document.querySelectorAll("[data-match]").forEach((button) => {
    button.onclick = () => {
      const [i, m] = button.dataset.match.split(":").map(Number);
      const item = state.items[i];
      const link = item.matches[m].link;
      item.url = item.url === link ? null : link;
      renderItems();
    };
  });
  $("#compose-item-count").textContent = state.items.length
    ? `${state.items.length} piece${state.items.length === 1 ? "" : "s"}`
    : "";
  document.querySelectorAll("[data-item-remove]").forEach((button) => {
    button.onclick = () => {
      state.items.splice(Number(button.dataset.itemRemove), 1);
      if (state.editing !== null) setItemEditorOpen(false);
      renderItems();
    };
  });
  document.querySelectorAll("[data-item-edit]").forEach((button) => {
    button.onclick = () => setItemEditorOpen(true, Number(button.dataset.itemEdit));
  });
}

// index: the piece to edit, or omit to add a new one.
function setItemEditorOpen(open, index = null) {
  state.editing = open ? index : null;
  $("#item-editor").classList.toggle("hidden", !open);
  $("#item-open").classList.toggle("hidden", open);
  if (!open) return;
  const item = index === null ? null : state.items[index];
  $("#item-name").value = item?.name || "";
  $("#item-brand").value = item?.brand || "";
  $("#item-color").value = item?.color || "";
  $("#item-url").value = item?.url || "";
  $("#item-url-error").classList.add("hidden");
  $("#item-add").textContent = item ? "Save piece" : "Add piece";
  selectCategory(item?.category || "top");
  $("#item-editor").scrollIntoView({ block: "nearest" });
  $("#item-name").focus();
}

function selectCategory(id) {
  state.category = id;
  document.querySelectorAll("[data-item-category]").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.itemCategory === id));
  });
}

function saveItem() {
  const name = $("#item-name").value.trim();
  if (!name) {
    $("#item-name").focus();
    return;
  }
  const url = $("#item-url").value.trim();
  if (url && !/^https?:\/\/\S+\.\S+/i.test(url)) {
    $("#item-url-error").classList.remove("hidden");
    $("#item-url").focus();
    return;
  }
  const fields = {
    category: state.category,
    name,
    brand: $("#item-brand").value.trim() || null,
    color: $("#item-color").value.trim() || null,
    url: url || null,
  };
  if (state.editing === null) {
    state.items.push({ ...fields, source: "user" });
  } else {
    // Edited suggestions keep source "detected" (that's where they came from) but stop being
    // `auto`, so a new cover photo won't replace them.
    const item = state.items[state.editing];
    state.items[state.editing] = { ...item, ...fields, auto: false };
  }
  renderItems();
  setItemEditorOpen(false);
}

// --- tags ---

// tags: [{ value, auto }]; auto ones came from detection and are replaced with the cover.
function addTags(kind, values, auto = false) {
  const list = state.tags[kind];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 30);
    if (value && list.length < 10 && !list.some((tag) => tag.value === value)) list.push({ value, auto });
  }
}

function renderTags() {
  for (const kind of ["occasion", "style"]) {
    const row = $(`[data-tag-kind="${kind}"]`);
    row.querySelectorAll(".tag-chip, .tag-add, .tag-input").forEach((el) => el.remove());
    const chips = state.tags[kind].map(
      (tag, i) => `
        <span class="tag-chip inline-flex items-center gap-0.5 h-8 pl-3 pr-1 rounded-full bg-surface-container-low border border-surface-container-high font-label-md text-label-md text-on-surface">
          ${escapeHtml(tag.value)}
          <button type="button" data-tag-remove="${kind}:${i}" aria-label="Remove ${escapeHtml(tag.value)}"
            class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container">
            <span class="material-symbols-outlined text-[15px]">close</span>
          </button>
        </span>`
    );
    if (state.tags[kind].length < 10) {
      chips.push(`
        <button type="button" class="tag-add inline-flex items-center gap-0.5 h-8 px-3 rounded-full border border-dashed border-outline-variant font-label-md text-label-md text-on-surface-variant" data-tag-add="${kind}">
          <span class="material-symbols-outlined text-[15px]">add</span>Add
        </button>`);
    }
    row.insertAdjacentHTML("beforeend", chips.join(""));
  }
  document.querySelectorAll("[data-tag-remove]").forEach((button) => {
    button.onclick = () => {
      const [kind, i] = button.dataset.tagRemove.split(":");
      state.tags[kind].splice(Number(i), 1);
      renderTags();
    };
  });
  document.querySelectorAll("[data-tag-add]").forEach((button) => {
    button.onclick = () => openTagInput(button);
  });
}

function openTagInput(button) {
  const kind = button.dataset.tagAdd;
  const input = document.createElement("input");
  input.className =
    "tag-input h-8 w-32 px-3 rounded-full bg-surface-container-lowest border border-secondary font-label-md text-label-md text-on-surface focus:outline-none";
  input.maxLength = 30;
  input.placeholder = kind === "occasion" ? "e.g. brunch" : "e.g. streetwear";
  button.replaceWith(input);
  input.focus();
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (save) addTags(kind, [input.value]);
    renderTags();
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.stopPropagation(); // close the tag input, not the whole sheet
      finish(false);
    }
  };
  input.onblur = () => finish(true);
}

function updateCaptionCount() {
  $("#compose-caption-count").textContent = `${$("#compose-caption").value.length} / 2200`;
}

// --- posting ---

function itemsForPost(imageIds) {
  return state.items.map(({ auto, matches, ...item }) => ({
    ...item,
    // A pin must point at one of this fit's photos (the cover may have been removed).
    pin: item.pin && imageIds.includes(item.pin.image_id) ? item.pin : null,
  }));
}

async function submitFit(event) {
  event.preventDefault();
  if (!state.photos.length) return;
  const submit = $("#compose-submit");
  submit.disabled = true;
  showError("#compose-error");
  try {
    submit.textContent = "Uploading photos…";
    const images = await Promise.all(state.photos.map((p) => p.image || uploadImage(p.file)));
    images.forEach((image, i) => (state.photos[i].image = image)); // don't re-upload on retry
    submit.textContent = "Posting…";
    const imageIds = images.map((image) => image.id);
    const fit = await createFit({
      imageIds,
      caption: $("#compose-caption").value.trim(),
      items: itemsForPost(imageIds),
      occasionTags: state.tags.occasion.map((tag) => tag.value),
      styleTags: state.tags.style.map((tag) => tag.value),
    });
    closeCreate();
    hooks.toast("Fit posted");
    hooks.onPosted(fit);
  } catch (err) {
    console.error(err);
    showError("#compose-error", errorMessage(err));
  } finally {
    submit.disabled = state.photos.length === 0;
    submit.textContent = "Post fit";
  }
}

// --- try-on ----------------------------------------------------------------------------

const blockedBy = (slot) => (CONFLICTS[slot] || []).filter((other) => state.tryon.pieces[other]);

function renderTryOn() {
  const t = state.tryon;
  if (!t.person) t.person = rememberedPerson();

  document.querySelectorAll("[data-tryon-mode]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.tryonMode === t.mode));
  });
  document.querySelectorAll("[data-tryon-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tryonPanel !== t.mode);
  });
  $("#tryon-intro").textContent = TRYON_INTRO[t.mode];
  renderPieces();

  for (const slot of ["person", "outfit"]) {
    const photo = t[slot];
    const el = $(`[data-tryon-slot="${slot}"]`);
    const preview = el.querySelector("[data-slot-preview]");
    preview.classList.toggle("hidden", !photo);
    if (photo) preview.src = photo.preview;
    el.querySelector(".slot-empty").classList.toggle("hidden", Boolean(photo));
    el.querySelector(".slot-filled").classList.toggle("hidden", !photo);
    el.querySelector(".slot-filled").classList.toggle("flex", Boolean(photo));
    el.classList.toggle("border-dashed", !photo);
    if (slot === "person") {
      el.querySelector("[data-slot-label]").textContent = photo?.remembered ? "Your last photo" : "You";
    }
  }
  const ready = t.mode === "outfit" ? Boolean(t.outfit) : Object.keys(t.pieces).length > 0;
  $("#tryon-start").disabled = !(t.person && ready);
}

function renderPieces() {
  const pieces = state.tryon.pieces;
  for (const slot of PIECE_SLOTS) {
    const piece = pieces[slot];
    const tile = $(`[data-piece-slot="${slot}"]`);
    const preview = tile.querySelector("[data-piece-preview]");
    preview.classList.toggle("hidden", !piece);
    if (piece) preview.src = piece.preview;
    tile.querySelector("[data-piece-icon]").classList.toggle("hidden", Boolean(piece));
    tile.querySelector("[data-piece-title]").classList.toggle("hidden", Boolean(piece));
    tile.classList.toggle("border-dashed", !piece);
    $(`[data-piece-remove="${slot}"]`).classList.toggle("hidden", !piece);

    const blocked = blockedBy(slot);
    tile.disabled = !piece && blocked.length > 0;
    tile.title = tile.disabled ? (slot === "one_piece" ? "Remove the top and bottom to add a dress" : "A dress replaces this") : "";
  }

  const note = $("#tryon-pieces-note");
  const message =
    state.tryon.mode !== "pieces"
      ? ""
      : pieces.one_piece
        ? "A dress replaces the top and bottom, so those are turned off."
        : pieces.top || pieces.bottom
          ? "To try a dress, remove the top and bottom first."
          : "";
  note.innerHTML = message ? `<span class="material-symbols-outlined text-[16px]">info</span>${message}` : "";
  note.classList.toggle("hidden", !message);
  note.classList.toggle("flex", Boolean(message));
}

function setTryOnMode(mode) {
  state.tryon.mode = mode;
  showError("#tryon-error");
  renderTryOn();
}

async function pickTryOnPhoto(slot) {
  const [file] = await pickFiles($("#tryon-file"));
  if (!file) return;
  const previous = state.tryon[slot];
  if (previous?.file) URL.revokeObjectURL(previous.preview);
  state.tryon[slot] = { file, preview: URL.createObjectURL(file) };
  showError("#tryon-error");
  renderTryOn();
}

async function pickPiece(slot) {
  const [file] = await pickFiles($("#tryon-file"));
  if (!file) return;
  removePiece(slot, { render: false });
  state.tryon.pieces[slot] = { file, preview: URL.createObjectURL(file) };
  showError("#tryon-error");
  renderTryOn();
}

function removePiece(slot, { render = true } = {}) {
  const piece = state.tryon.pieces[slot];
  if (piece?.file) URL.revokeObjectURL(piece.preview);
  delete state.tryon.pieces[slot];
  if (render) renderTryOn();
}

// The chosen pieces head to toe, as [slot, piece] pairs.
const chosenPieces = () =>
  PIECE_SLOTS.filter((slot) => state.tryon.pieces[slot]).map((slot) => [slot, state.tryon.pieces[slot]]);

async function runTryOn() {
  const t = state.tryon;
  const run = ++t.run;
  const stale = () => run !== t.run;
  showError("#tryon-error");
  show("tryon-loading");
  $("#tryon-loading-person").src = t.person.preview;

  let step = 0;
  $("#tryon-step").textContent = TRYON_STEPS[0];
  const ticker = setInterval(() => {
    step = Math.min(step + 1, TRYON_STEPS.length - 1);
    $("#tryon-step").textContent = TRYON_STEPS[step];
  }, 4500);

  try {
    // Upload once; "Try again" reuses the same images.
    if (!t.person.image) {
      t.person.image = await uploadImage(t.person.file);
      rememberPerson(t.person.image);
    }
    let clothing;
    if (t.mode === "outfit") {
      if (!t.outfit.image) t.outfit.image = await uploadImage(t.outfit.file);
      clothing = { outfitImageId: t.outfit.image.id };
    } else {
      const pieces = chosenPieces();
      await Promise.all(
        pieces.map(async ([, piece]) => {
          if (!piece.image) piece.image = await uploadImage(piece.file);
        })
      );
      clothing = { pieces: pieces.map(([slot, piece]) => ({ slot, imageId: piece.image.id })) };
    }
    if (stale()) return;
    t.result = await createTryOn(t.person.image.id, clothing);
    if (stale()) return;
    showResult();
  } catch (err) {
    if (stale()) return;
    console.error(err);
    // Uploads above are fresh, so "Image not found" means the remembered person photo.
    if (err instanceof ApiError && err.message === "Image not found" && t.person.remembered) {
      // The remembered photo was deleted; ask for a new one.
      forgetPerson();
      t.person = null;
    }
    show("tryon");
    showError("#tryon-error", errorMessage(err));
  } finally {
    clearInterval(ticker);
  }
}

function showResult() {
  const image = state.tryon.result.result_image;
  show("tryon-result");
  $("#tryon-result-frame").style.aspectRatio = `${image.width} / ${image.height}`;
  $("#tryon-result-image").src = mediaUrl(image.url);
  $("#tryon-before-image").src = state.tryon.person.preview;
  $("#tryon-result-badge").innerHTML = aiBadge();
  compare("after");
}

function compare(which) {
  const before = which === "before";
  $("#tryon-before-image").classList.toggle("hidden", !before);
  $("#tryon-result-badge").classList.toggle("hidden", before);
  document.querySelectorAll("[data-compare]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.compare === which));
  });
}

function postTryOn() {
  // The try-on result is already uploaded, so detection starts right away.
  state.photos = [{ image: state.tryon.result.result_image }];
  state.items = [];
  state.tags = { occasion: [], style: [] };
  show("compose");
}

// --- wiring ----------------------------------------------------------------------------

// Call after the sheet's markup is in the page.
export function initCreate({ onPosted, toast }) {
  hooks = { onPosted, toast };
  state = freshState();

  $("#create-close").onclick = closeCreate;
  // Block bodies on purpose: an onclick handler that returns false cancels the click, which
  // would stop the form's submit button from working.
  $("#create-backdrop").onclick = (e) => {
    if (e.target.id === "create-backdrop") closeCreate();
  };
  // Same function each time, so re-rendering the page does not stack listeners.
  document.addEventListener("keydown", closeOnEscape);
  $("#create-back").onclick = () => {
    const back = SCREENS[state.screen].back;
    if (back) show(back);
  };
  document.querySelectorAll("[data-create-go]").forEach((button) => {
    button.onclick = () => show(button.dataset.createGo);
  });

  $("#compose-form").onsubmit = submitFit;
  $("#compose-caption").oninput = updateCaptionCount;
  $("#item-open").onclick = () => setItemEditorOpen(true);
  $("#item-cancel").onclick = () => setItemEditorOpen(false);
  $("#item-add").onclick = saveItem;
  $("#item-name").onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveItem();
    }
  };
  document.querySelectorAll("[data-item-category]").forEach((chip) => {
    chip.onclick = () => selectCategory(chip.dataset.itemCategory);
  });

  document.querySelectorAll("[data-tryon-slot]").forEach((slot) => {
    slot.onclick = () => pickTryOnPhoto(slot.dataset.tryonSlot);
  });
  $("#tryon-start").onclick = runTryOn;
  $("#tryon-again").onclick = runTryOn;
  document.querySelectorAll("[data-tryon-mode]").forEach((tab) => {
    tab.onclick = () => setTryOnMode(tab.dataset.tryonMode);
  });
  document.querySelectorAll("[data-piece-slot]").forEach((tile) => {
    tile.onclick = () => pickPiece(tile.dataset.pieceSlot);
  });
  document.querySelectorAll("[data-piece-remove]").forEach((button) => {
    button.onclick = () => removePiece(button.dataset.pieceRemove);
  });
  $("#tryon-new").onclick = () => {
    // Keep the photo of you and the mode; start over on the clothes.
    const t = state.tryon;
    if (t.outfit?.file) URL.revokeObjectURL(t.outfit.preview);
    t.outfit = null;
    Object.keys(t.pieces).forEach((slot) => removePiece(slot, { render: false }));
    show("tryon");
  };
  $("#tryon-post").onclick = postTryOn;
  document.querySelectorAll("[data-compare]").forEach((tab) => {
    tab.onclick = () => compare(tab.dataset.compare);
  });
}
