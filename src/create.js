// Behaviour for the "+" sheet (markup in src/views/create-sheet.js): posting a fit, and AI try-on.

import { ApiError } from "./auth.js";
import { currentUser } from "./data.js";
import {
  blurFaces,
  categoryOf,
  createFit,
  createTryOn,
  detectPieces,
  mediaUrl,
  updateFit,
  uploadImage,
} from "./fits.js";
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
// The item categories each try-on slot can produce, for tagging only the pieces tried on.
const SLOT_CATEGORIES = {
  head: ["headwear"],
  top: ["top"],
  outerwear: ["outerwear"],
  one_piece: ["dress"],
  bottom: ["bottom"],
  feet: ["shoes"],
  accessory: ["bag", "accessory", "jewelry"],
};

// One-tap polls. Picking one fills in the question and answers, which stay editable.
const POLL_PRESETS = [
  { id: "wear", label: "Wear it?", question: "Would you wear it?", options: ["Wear it", "Rethink"] },
  { id: "rate", label: "Rate it", question: "Rate this fit", options: ["🔥 Fire", "👍 Solid", "😐 Meh"] },
  { id: "keep", label: "Keep or return?", question: "Keep it or return it?", options: ["Keep", "Return"] },
  { id: "where", label: "Where to?", question: "Where should I wear this?", options: ["Class", "Date night", "Going out"] },
  { id: "custom", label: "Custom", question: "", options: ["", ""] },
  { id: "none", label: "No poll" },
];
const MAX_POLL_OPTIONS = 4;
const pollFromPreset = (id) => {
  const preset = POLL_PRESETS.find((p) => p.id === id);
  return { preset: id, question: preset.question || "", options: [...(preset.options || [])] };
};

const SCREENS = {
  menu: { kicker: "Create", title: "What are we doing?" },
  compose: { kicker: "New fit", title: "Post a fit", back: "menu" },
  tryon: { kicker: "AI try-on", title: "Try it on", back: "menu" },
  "tryon-loading": { kicker: "AI try-on", title: "Working on it" },
  "tryon-result": { kicker: "AI try-on", title: "Here's your look", back: "tryon" },
};
// The compose screen while editing a posted fit.
const EDIT_SCREEN = { kicker: "Edit fit", title: "Edit your fit" };

let state;
let hooks = { onPosted: () => {}, toast: () => {} };
let selectedPrivacyTier = "public";
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
    editingItem: null, // index of the piece open in the editor, or null when adding
    // checked: the photos the last detection looked at (null before the first one).
    detect: { checked: null, run: 0, status: "idle", found: 0 },
    // Posting a try-on result: { tryonId, imageId, categories }. tryonId is sent with the post
    // while that photo is in it. categories: the item categories tried on (a promise for an
    // entire fit), so detection on that photo keeps only those; null keeps everything.
    posting: null,
    // The poll to post: preset (POLL_PRESETS id) plus the question and answers as typed.
    // locked: editing a fit someone has voted on, so the poll can't change.
    poll: { ...pollFromPreset("wear"), locked: false },
    // Editing a posted fit: { fit, onSaved }. Its photos can't change, so there's no detection.
    editing: null,
    // mode is "outfit" (one photo of a whole fit) or "pieces" (a photo per slot in `pieces`).
    // hideFace: "Hide my face" is on. blurred: the result with the face blurred, once made.
    // fitId / from: "Try this look" on someone's fit (its id and author's username), else null.
    tryon: {
      mode: "outfit",
      person: null,
      outfit: null,
      pieces: {},
      result: null,
      run: 0,
      hideFace: false,
      blurred: null,
      fitId: null,
      from: null,
    },
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

// --- remembering "Hide my face" between try-ons -----------------------------------------

const HIDE_FACE_KEY = "outfitted.tryon.hideFace";

function prefersHiddenFace() {
  try {
    return localStorage.getItem(HIDE_FACE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberHideFace(on) {
  try {
    localStorage.setItem(HIDE_FACE_KEY, on ? "1" : "0");
  } catch {}
}

// --- sheet -----------------------------------------------------------------------------

function closeOnEscape(e) {
  if (e.key === "Escape" && !$("#create-backdrop").classList.contains("hidden")) closeCreate();
}

// setup(state) can fill in the fresh state before the first screen renders.
export function openCreate(screen = "menu", setup = null) {
  state = freshState();
  setup?.(state);
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
    selectTier("public");
    $("#compose-allow-tryon").checked = true;
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
  const meta = screen === "compose" && state.editing ? EDIT_SCREEN : SCREENS[screen];
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
  renderPoll();
  renderDetectStatus();
  updateCaptionCount();
  showError("#compose-error");
}

function renderPhotos() {
  const locked = Boolean(state.editing); // a posted fit's photos can't be changed
  const tiles = state.photos.map((photo, i) => {
    const src = photo.preview || mediaUrl(photo.image.url);
    return `
      <div class="relative flex-shrink-0 w-24 h-32 rounded-DEFAULT overflow-hidden bg-surface-container-high">
        <img class="w-full h-full object-cover" alt="Photo ${i + 1}" src="${escapeHtml(src)}" />
        ${photo.image?.generated ? aiBadge("absolute bottom-1.5 left-1.5 scale-90 origin-bottom-left") : ""}
        ${locked ? "" : `<button type="button" data-photo-remove="${i}" aria-label="Remove photo ${i + 1}"
          class="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>`}
        ${i === 0 ? `<span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-white/85 text-[#1a1c1b] font-micro-mono text-[9px] uppercase font-bold">Cover</span>` : ""}
      </div>`;
  });
  if (!locked && state.photos.length < MAX_PHOTOS) {
    tiles.push(`
      <button type="button" id="compose-add-photo"
        class="flex-shrink-0 w-24 h-32 rounded-DEFAULT border border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center gap-1 text-on-surface-variant active:scale-95 transition-transform">
        <span class="material-symbols-outlined text-[26px] text-secondary">add_a_photo</span>
        <span class="font-label-sm text-label-sm">${state.photos.length ? "Add more" : "Add photos"}</span>
      </button>`);
  }
  $("#compose-photos").innerHTML = tiles.join("");
  $("#compose-photo-count").textContent = locked
    ? "Can't be changed after posting"
    : `${state.photos.length} / ${MAX_PHOTOS}`;
  $("#compose-submit").disabled = state.photos.length === 0;
  $("#compose-submit").textContent = locked ? "Save changes" : "Post fit";

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
  photosChanged();
}

// --- piece detection, when the user taps "Find pieces" ---

const samePhotos = (a, b) => a.length === b.length && a.every((photo) => b.includes(photo));

// After adding or removing photos: detection waits for "Find pieces", since more photos may
// be on the way. A detection still running for other photos is dropped.
function photosChanged() {
  if (state.editing) return; // keep the pieces the fit was posted with
  const d = state.detect;
  if (d.status === "running" && samePhotos(d.checked, state.photos)) return;
  if (!state.photos.length) {
    d.run++;
    d.checked = null;
    d.status = "idle";
    dropSuggestions();
  } else if (d.status === "running" || !d.checked || !samePhotos(d.checked, state.photos)) {
    d.run++;
    d.status = d.checked ? "changed" : "ready";
  }
  renderDetectStatus();
}

// Looks at every photo. The first photo's pieces are kept; a later photo adds only kinds of
// piece not found yet (shoes only that one shows), so one outfit from two angles isn't listed
// twice. Suggestions are marked `auto` until the user edits them; a new run replaces only those
// and skips kinds of piece the user already has.
async function findPieces() {
  const d = state.detect;
  const photos = [...state.photos];
  if (!photos.length) return;
  const run = ++d.run;
  const stale = () => run !== d.run;
  d.checked = photos;
  d.status = "running";
  renderDetectStatus();
  try {
    // Uploading now also means posting won't upload them again.
    await Promise.all(photos.map(async (photo) => (photo.image ||= await uploadImage(photo.file))));
    if (stale()) return;
    const results = await Promise.all(photos.map((photo) => detectPieces(photo.image.id).catch(() => null)));
    if (stale()) return;
    if (results.every((result) => !result)) throw new Error("Detection failed on every photo");
    // A pieces try-on: the photo also shows clothes the user didn't try on (their own), so
    // tag only what they tried. A directly uploaded photo keeps everything detected.
    const tried = await state.posting?.categories;
    if (stale()) return;
    // Pieces the user added or edited stay, so a new run doesn't suggest another of those kinds.
    const kept = state.items.filter((item) => !item.auto).map((item) => item.category);
    const items = [];
    let onlyTried = false;
    results.forEach((result, i) => {
      if (!result) return;
      const triedHere = state.posting?.imageId === photos[i].image.id ? tried : null;
      onlyTried ||= Boolean(triedHere);
      const known = new Set([...kept, ...items.map((item) => item.category)]);
      items.push(
        ...result.items.filter((item) => !known.has(item.category) && (!triedHere || triedHere.includes(item.category)))
      );
    });
    dropSuggestions();
    state.items.push(...items.map((item) => ({ ...item, auto: true })));
    results.forEach((result) => {
      if (!result) return;
      addTags("occasion", result.occasion_tags, true);
      addTags("style", result.style_tags, true);
    });
    d.onlyTried = onlyTried;
    d.status = "done";
    d.found = items.length;
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
  if (state.editing) {
    $("#compose-detect").innerHTML = `
      <span class="material-symbols-outlined text-[16px] text-secondary">edit</span>
      <span>Tap a piece to edit it or add where to buy it.</span>`;
    return;
  }
  const d = state.detect;
  const count = state.photos.length;
  const photos = `${count} photo${count === 1 ? "" : "s"}`;
  // [icon, text, button label or null]
  const messages = {
    idle: ["photo_camera", "Add all your photos, then we'll find the pieces in them.", null],
    ready: ["photo_library", "Added all your photos?", count > 1 ? `Find pieces in ${photos}` : "Find pieces"],
    changed: ["photo_library", "Your photos changed.", "Find pieces again"],
    running: ["progress_activity", `Finding the pieces in ${photos}…`, null],
    done: d.found
      ? ["auto_awesome", `Found ${d.found} piece${d.found === 1 ? "" : "s"}${d.onlyTried ? " you tried on" : ""}. Tap one to edit it.`, null]
      : ["auto_awesome", `We couldn't spot ${d.onlyTried ? "the pieces you tried on" : "any pieces"}. Add them yourself.`, null],
    failed: ["info", "Couldn't detect the pieces right now.", "Try again"],
  };
  const [icon, text, action] = messages[d.status];
  $("#compose-detect").innerHTML = `
    <span class="material-symbols-outlined text-[16px] ${d.status === "running" ? "animate-spin" : "text-secondary"}">${icon}</span>
    <span>${text}</span>
    ${
      action
        ? `<button type="button" id="compose-find" class="ml-auto flex-shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold active:scale-95 transition-transform">
            <span class="material-symbols-outlined text-[16px]">auto_awesome</span>${action}
          </button>`
        : ""
    }`;
  const find = $("#compose-find");
  if (find) find.onclick = findPieces;
}

// --- pieces ---

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function renderItems() {
  $("#compose-items").innerHTML = state.items
    .map((item, i) => {
      const category = categoryOf(item.category);
      const detail = [item.brand, item.color, item.material].filter(Boolean).map(escapeHtml).join(" · ");
      // Links come only from the user: a piece without one offers to add it.
      const link = item.url
        ? `<span class="inline-flex items-center gap-0.5 text-secondary font-semibold"><span class="material-symbols-outlined text-[13px]">link</span>${escapeHtml(hostOf(item.url))}</span>`
        : `<span class="inline-flex items-center gap-0.5 text-secondary font-semibold" data-add-link><span class="material-symbols-outlined text-[13px]">add_link</span>Add shop link</span>`;
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
              <span class="font-label-sm text-label-sm truncate">${link}</span>
            </span>
          </button>
          <button type="button" data-item-remove="${i}" aria-label="Remove ${escapeHtml(item.name)}"
            class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
       </div>`;
    })
    .join("");
  $("#compose-item-count").textContent = state.items.length
    ? `${state.items.length} piece${state.items.length === 1 ? "" : "s"}`
    : "";
  document.querySelectorAll("[data-item-remove]").forEach((button) => {
    button.onclick = () => {
      state.items.splice(Number(button.dataset.itemRemove), 1);
      if (state.editingItem !== null) setItemEditorOpen(false);
      renderItems();
    };
  });
  document.querySelectorAll("[data-item-edit]").forEach((button) => {
    button.onclick = (e) => {
      // "Add shop link" opens the same editor, ready to paste the link.
      const focus = e.target.closest("[data-add-link]") ? "#item-url" : "#item-name";
      setItemEditorOpen(true, Number(button.dataset.itemEdit), { focus });
    };
  });
}

// index: the piece to edit, or omit to add a new one. focus: the field to start in.
function setItemEditorOpen(open, index = null, { focus = "#item-name" } = {}) {
  state.editingItem = open ? index : null;
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
  $(focus).focus();
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
  if (state.editingItem === null) {
    state.items.push({ ...fields, source: "user" });
  } else {
    // Edited suggestions keep source "detected" (that's where they came from) but stop being
    // `auto`, so a new cover photo won't replace them.
    const item = state.items[state.editingItem];
    state.items[state.editingItem] = { ...item, ...fields, auto: false };
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

// --- poll ---

function renderPoll() {
  const poll = state.poll;
  const none = poll.preset === "none";
  $("#compose-poll-presets").innerHTML = POLL_PRESETS.map(
    (preset) => `<button type="button" data-poll-preset="${preset.id}" aria-pressed="${poll.preset === preset.id}" ${poll.locked ? "disabled" : ""}
        class="item-chip flex-shrink-0 h-9 px-3 rounded-full flex items-center font-label-md text-label-md transition-colors disabled:opacity-50">${escapeHtml(preset.label)}</button>`
  ).join("");
  $("#compose-poll-note").textContent = poll.locked ? "Locked: people have voted" : none ? "" : "Up to 4 answers";
  $("#compose-poll-fields").classList.toggle("hidden", none);
  const question = $("#compose-poll-question");
  question.value = poll.question;
  question.disabled = poll.locked;
  $("#compose-poll-options").innerHTML = poll.options
    .map(
      (option, i) => `<div class="flex items-center gap-space-xs">
        <input class="h-11 flex-1 min-w-0 px-4 rounded bg-surface-container-low border border-surface-container-high font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary disabled:opacity-60"
          data-poll-option="${i}" maxlength="30" placeholder="Answer ${i + 1}" value="${escapeHtml(option)}" ${poll.locked ? "disabled" : ""} />
        ${
          poll.options.length > 2 && !poll.locked
            ? `<button type="button" data-poll-remove="${i}" aria-label="Remove answer ${i + 1}" class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[18px]">close</span></button>`
            : ""
        }
      </div>`
    )
    .join("");
  $("#compose-poll-add").classList.toggle("hidden", poll.locked || poll.options.length >= MAX_POLL_OPTIONS);

  document.querySelectorAll("[data-poll-preset]").forEach((chip) => {
    chip.onclick = () => {
      state.poll = { ...pollFromPreset(chip.dataset.pollPreset), locked: false };
      renderPoll();
      if (state.poll.preset === "custom") $("#compose-poll-question").focus();
    };
  });
  document.querySelectorAll("[data-poll-option]").forEach((input) => {
    input.oninput = () => (state.poll.options[Number(input.dataset.pollOption)] = input.value);
  });
  document.querySelectorAll("[data-poll-remove]").forEach((button) => {
    button.onclick = () => {
      state.poll.options.splice(Number(button.dataset.pollRemove), 1);
      renderPoll();
    };
  });
}

// The poll to send: { question, options }, null for no poll, or an error message.
function pollForPost() {
  const poll = state.poll;
  if (poll.preset === "none") return { poll: null };
  const question = poll.question.trim();
  const options = poll.options.map((option) => option.trim());
  if (!question) return { error: "Add a question for your poll, or pick No poll." };
  if (options.some((option) => !option)) return { error: "Fill in every poll answer, or remove the empty one." };
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    return { error: "Each poll answer needs to be different." };
  }
  return { poll: { question, options } };
}

// A posted fit's poll as compose state: its preset if it matches one, else custom.
function pollFromFit(fit) {
  if (!fit.poll) return { ...pollFromPreset("none"), locked: false };
  const options = fit.poll.options.map((option) => option.label);
  const preset = POLL_PRESETS.find(
    (p) => p.question === fit.poll.question && p.options?.join("\n") === options.join("\n")
  );
  return { preset: preset?.id || "custom", question: fit.poll.question, options, locked: fit.poll.locked };
}

// --- posting ---

function itemsForPost(imageIds) {
  // id: a posted fit's pieces have one, but saving replaces them all.
  return state.items.map(({ auto, id, ...item }) => ({
    ...item,
    // A pin must point at one of this fit's photos (the cover may have been removed).
    pin: item.pin && imageIds.includes(item.pin.image_id) ? item.pin : null,
  }));
}

async function submitFit(event) {
  event.preventDefault();
  if (state.editing) return saveEdits();
  if (!state.photos.length) return;
  const { poll, error } = pollForPost();
  if (error) return showError("#compose-error", error);
  const submit = $("#compose-submit");
  submit.disabled = true;
  showError("#compose-error");
  try {
    submit.textContent = "Uploading photos…";
    const images = await Promise.all(state.photos.map((p) => p.image || uploadImage(p.file)));
    images.forEach((image, i) => (state.photos[i].image = image)); // don't re-upload on retry
    submit.textContent = "Posting…";
    const imageIds = images.map((image) => image.id);
    const allowTryOn = $("#compose-allow-tryon")?.checked ?? true;
    const posting = state.posting;
    const fit = await createFit({
      tryonId: posting && imageIds.includes(posting.imageId) ? posting.tryonId : null,
      imageIds,
      caption: $("#compose-caption").value.trim(),
      items: itemsForPost(imageIds),
      occasionTags: state.tags.occasion.map((tag) => tag.value),
      styleTags: state.tags.style.map((tag) => tag.value),
      privacyTier: selectedPrivacyTier,
      allowFriendTryOn: allowTryOn,
      poll,
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

// --- editing a posted fit ---

function selectTier(tier) {
  selectedPrivacyTier = tier;
  document.querySelectorAll(".btn-tier-select").forEach((b) => {
    b.className =
      b.dataset.tier === tier
        ? "py-2 px-1 rounded-full font-label-sm text-label-sm font-semibold bg-primary text-on-primary transition-all active:scale-95 btn-tier-select"
        : "py-2 px-1 rounded-full font-label-sm text-label-sm font-semibold text-on-surface hover:bg-surface-container transition-all active:scale-95 btn-tier-select";
  });
}

// Opens the compose screen filled in with your fit. onSaved(fit) gets the updated fit.
// item: the index of a piece to open in the editor straight away, at its shop link.
export function openEditFit(fit, { onSaved = () => {}, item = null } = {}) {
  openCreate("compose", (s) => {
    s.editing = { fit, onSaved };
    s.photos = fit.images.map((image) => ({ image }));
    s.items = fit.items.map((posted) => ({ ...posted }));
    s.tags = {
      occasion: (fit.occasion_tags || []).map((value) => ({ value, auto: false })),
      style: (fit.style_tags || []).map((value) => ({ value, auto: false })),
    };
    s.poll = pollFromFit(fit);
  });
  $("#compose-caption").value = fit.caption || "";
  updateCaptionCount();
  selectTier(fit.privacy_tier || "public");
  $("#compose-allow-tryon").checked = fit.allow_friend_try_on ?? true;
  if (item !== null && fit.items[item]) setItemEditorOpen(true, item, { focus: "#item-url" });
}

async function saveEdits() {
  const { fit, onSaved } = state.editing;
  // A voted-on poll can't change, so it isn't sent.
  const { poll, error } = state.poll.locked ? {} : pollForPost();
  if (error) return showError("#compose-error", error);
  const submit = $("#compose-submit");
  submit.disabled = true;
  submit.textContent = "Saving…";
  showError("#compose-error");
  try {
    const updated = await updateFit(fit.id, {
      caption: $("#compose-caption").value.trim() || null,
      items: itemsForPost(fit.images.map((image) => image.id)),
      occasionTags: state.tags.occasion.map((tag) => tag.value),
      styleTags: state.tags.style.map((tag) => tag.value),
      privacyTier: selectedPrivacyTier,
      allowFriendTryOn: $("#compose-allow-tryon").checked,
      poll,
    });
    closeCreate();
    hooks.toast("Changes saved");
    onSaved(updated);
  } catch (err) {
    console.error(err);
    showError("#compose-error", errorMessage(err));
    submit.disabled = false;
    submit.textContent = "Save changes";
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
  $("#tryon-intro").textContent = t.from
    ? `Trying @${t.from}'s look. Add a photo of you, or swap any piece for your own.`
    : TRYON_INTRO[t.mode];
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
    t.result = await createTryOn(t.person.image.id, { ...clothing, fitId: t.fitId });
    t.blurred = null;
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
  const t = state.tryon;
  const image = t.result.result_image;
  show("tryon-result");
  showError("#tryon-result-error");
  $("#tryon-result-frame").style.aspectRatio = `${image.width} / ${image.height}`;
  $("#tryon-result-frame").style.setProperty("--result-ratio", String(image.width / image.height));
  $("#tryon-before-image").src = t.person.preview;
  $("#tryon-result-badge").innerHTML = aiBadge();
  compare("after");
  t.hideFace = false;
  renderHideFace();
  if (prefersHiddenFace()) setHideFace(true);
}

// The image to show and post: the blurred copy while "Hide my face" is on.
function resultImage() {
  const t = state.tryon;
  return t.hideFace && t.blurred ? t.blurred : t.result.result_image;
}

function renderHideFace({ busy = false } = {}) {
  const t = state.tryon;
  const toggle = $("#tryon-hide-face");
  toggle.setAttribute("aria-checked", String(t.hideFace));
  toggle.setAttribute("aria-busy", String(busy));
  toggle.disabled = busy;
  $("#tryon-post").disabled = busy;
  $("#tryon-hide-face-note").textContent = busy
    ? "Blurring your face…"
    : t.hideFace
      ? "Your face is blurred in the photo you post."
      : "Blur your face in the photo you post.";
  $("#tryon-result-image").src = mediaUrl(resultImage().url);
}

async function setHideFace(on) {
  const t = state.tryon;
  const result = t.result;
  showError("#tryon-result-error");
  rememberHideFace(on);
  t.hideFace = on;
  // The blurred copy is made once per result, then reused when toggling back and forth.
  if (!on || t.blurred) {
    renderHideFace();
    return;
  }
  renderHideFace({ busy: true });
  try {
    const blurred = await blurFaces(result.result_image.id);
    if (t.result !== result) return; // a newer try-on replaced this one
    t.blurred = blurred;
    renderHideFace();
  } catch (err) {
    if (t.result !== result) return;
    // Never show the switch as on unless the face really is blurred.
    t.hideFace = false;
    renderHideFace();
    showError("#tryon-result-error", errorMessage(err));
  }
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
  state.photos = [{ image: resultImage() }];
  const t = state.tryon;
  state.posting = {
    tryonId: t.result.id,
    imageId: resultImage().id,
    categories:
      t.result.mode === "pieces"
        ? t.result.pieces.flatMap((p) => SLOT_CATEGORIES[p.slot] || [])
        : outfitCategories(t.outfit),
  };
  state.items = [];
  state.tags = { occasion: [], style: [] };
  show("compose");
  // The one photo is ready, so there's nothing to wait for.
  findPieces();
}

// What an entire-fit try-on put on: the pieces in the outfit photo, which may be just a top
// and trousers. Someone else's photo (Try this look) can't be sent to detection, so it uses the
// pieces tagged on their post. Resolves to null (keep everything) if neither finds anything.
async function outfitCategories(outfit) {
  if (outfit?.categories?.length) return outfit.categories;
  if (!outfit?.image || outfit.shared) return null;
  try {
    const { items } = await detectPieces(outfit.image.id);
    return items.length ? items.map((item) => item.category) : null;
  } catch {
    return null;
  }
}

// --- "Try this look" on someone's fit -------------------------------------------------------

// Opens the try-on screen with the fit's clothes filled in: the photos from the try-on it was
// posted from (its outfit photo, or each piece in its slot), or else its cover photo as the
// outfit. The person slot keeps your last photo, as usual.
export function openTryOnFrom(fit) {
  const mine = fit.author.username === currentUser.username;
  if (!fit.allow_friend_try_on && !mine) {
    hooks.toast(`@${fit.author.username} turned off try-ons for this fit`);
    return;
  }
  const shared = (image) => ({ image, preview: mediaUrl(image.url), shared: true });
  openCreate("tryon", (s) => {
    const t = s.tryon;
    const source = fit.try_on_source;
    t.fitId = fit.id;
    t.from = mine ? null : fit.author.username;
    if (source?.mode === "pieces") {
      t.mode = "pieces";
      source.pieces.forEach(({ slot, image }) => (t.pieces[slot] = shared(image)));
    } else {
      const outfit = source?.outfit_image || fit.images?.[0];
      // The post's tagged pieces say what's in the outfit (see outfitCategories).
      if (outfit) t.outfit = { ...shared(outfit), categories: (fit.items || []).map((item) => item.category) };
    }
  });
}

function startDilemma() {
  closeCreate();
  hooks.onDilemma?.();
}

function startStory() {
  closeCreate();
  hooks.onStory?.();
}

const MENU_ACTIONS = { dilemma: startDilemma, story: startStory };

// --- wiring ----------------------------------------------------------------------------

// Call after the sheet's markup is in the page.
export function initCreate({ onPosted, onDilemma, onStory, toast }) {
  hooks = { onPosted, onDilemma, onStory, toast };
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
    button.onclick = () => (MENU_ACTIONS[button.dataset.createGo] || show)(button.dataset.createGo);
  });

  $("#compose-form").onsubmit = submitFit;
  $("#compose-poll-question").oninput = (e) => (state.poll.question = e.target.value);
  $("#compose-poll-add").onclick = () => {
    if (state.poll.options.length >= MAX_POLL_OPTIONS) return;
    state.poll.options.push("");
    renderPoll();
    document.querySelector(`[data-poll-option="${state.poll.options.length - 1}"]`)?.focus();
  };
  $("#compose-caption").oninput = updateCaptionCount;

  document.querySelectorAll(".btn-tier-select").forEach((btn) => {
    btn.onclick = () => selectTier(btn.dataset.tier);
  });
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
  $("#tryon-hide-face").onclick = () => setHideFace(!state.tryon.hideFace);
  document.querySelectorAll("[data-compare]").forEach((tab) => {
    tab.onclick = () => compare(tab.dataset.compare);
  });
}
