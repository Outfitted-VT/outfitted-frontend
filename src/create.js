// Behaviour for the "+" sheet (markup in src/views/create-sheet.js): posting a fit, and AI try-on.

import { ApiError } from "./auth.js";
import { currentUser } from "./data.js";
import { categoryOf, createFit, createTryOn, mediaUrl, uploadImage } from "./fits.js";
import { escapeHtml } from "./format.js";
import { aiBadge } from "./views/fit-card.js";

const MAX_PHOTOS = 10;
const TRYON_STEPS = ["Uploading your photos…", "Reading the outfit…", "Dressing you…", "Finishing the details…"];

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
    items: [],
    category: "top",
    tryon: { person: null, outfit: null, slot: null, result: null, run: 0 },
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

export function openCreate(screen = "menu") {
  state = freshState();
  const sheet = $("#create-sheet");
  $("#create-backdrop").classList.remove("hidden");
  show(screen);
  void sheet.offsetHeight; // lay out the hidden position first, so the slide-up animates
  sheet.classList.remove("translate-y-full");
}

function closeCreate() {
  state.tryon.run++; // ignore a try-on that finishes after closing
  $("#create-sheet").classList.add("translate-y-full");
  setTimeout(() => {
    $("#create-backdrop").classList.add("hidden");
    revokePreviews();
    state = freshState();
    renderPhotos();
    renderItems();
    $("#compose-caption").value = "";
  }, 280);
}

function revokePreviews() {
  const local = [...state.photos, state.tryon.person, state.tryon.outfit].filter((p) => p?.file);
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
        ${i === 0 ? `<span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-white/85 text-on-surface font-micro-mono text-[9px] uppercase font-bold">Cover</span>` : ""}
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
}

function renderItems() {
  $("#compose-items").innerHTML = state.items
    .map((item, i) => {
      const category = categoryOf(item.category);
      const detail = [item.brand, item.color].filter(Boolean).map(escapeHtml).join(" · ");
      return `
        <div class="flex items-center gap-space-sm bg-surface-container-low rounded-DEFAULT p-space-xs pr-1">
          <span class="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant flex-shrink-0">
            <span class="material-symbols-outlined text-[20px]">${category.icon}</span>
          </span>
          <span class="flex flex-col min-w-0 flex-1">
            <span class="font-label-md text-label-md text-on-surface font-semibold truncate">${escapeHtml(item.name)}</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant font-normal truncate">${category.label}${detail ? ` · ${detail}` : ""}</span>
          </span>
          <button type="button" data-item-remove="${i}" aria-label="Remove ${escapeHtml(item.name)}"
            class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>`;
    })
    .join("");
  $("#compose-item-count").textContent = state.items.length
    ? `${state.items.length} piece${state.items.length === 1 ? "" : "s"}`
    : "Tag what you're wearing";
  document.querySelectorAll("[data-item-remove]").forEach((button) => {
    button.onclick = () => {
      state.items.splice(Number(button.dataset.itemRemove), 1);
      renderItems();
    };
  });
}

function setItemEditorOpen(open) {
  $("#item-editor").classList.toggle("hidden", !open);
  $("#item-open").classList.toggle("hidden", open);
  if (!open) return;
  ["#item-name", "#item-brand", "#item-color"].forEach((id) => ($(id).value = ""));
  selectCategory("top");
  $("#item-name").focus();
}

function selectCategory(id) {
  state.category = id;
  document.querySelectorAll("[data-item-category]").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.itemCategory === id));
  });
}

function addItem() {
  const name = $("#item-name").value.trim();
  if (!name) {
    $("#item-name").focus();
    return;
  }
  state.items.push({
    category: state.category,
    name,
    brand: $("#item-brand").value.trim() || null,
    color: $("#item-color").value.trim() || null,
  });
  renderItems();
  setItemEditorOpen(false);
}

function updateCaptionCount() {
  $("#compose-caption-count").textContent = `${$("#compose-caption").value.length} / 2200`;
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
    const fit = await createFit({
      imageIds: images.map((image) => image.id),
      caption: $("#compose-caption").value.trim(),
      items: state.items,
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

function renderTryOn() {
  const t = state.tryon;
  if (!t.person) t.person = rememberedPerson();
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
  $("#tryon-start").disabled = !(t.person && t.outfit);
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
    if (!t.outfit.image) t.outfit.image = await uploadImage(t.outfit.file);
    if (stale()) return;
    t.result = await createTryOn(t.person.image.id, t.outfit.image.id);
    if (stale()) return;
    showResult();
  } catch (err) {
    if (stale()) return;
    console.error(err);
    if (err instanceof ApiError && err.status === 400 && t.person.remembered) {
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
  state.photos = [{ image: state.tryon.result.result_image }];
  state.items = [];
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
  $("#item-add").onclick = addItem;
  $("#item-name").onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
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
  $("#tryon-new").onclick = () => {
    if (state.tryon.outfit?.file) URL.revokeObjectURL(state.tryon.outfit.preview);
    state.tryon.outfit = null;
    show("tryon");
  };
  $("#tryon-post").onclick = postTryOn;
  document.querySelectorAll("[data-compare]").forEach((tab) => {
    tab.onclick = () => compare(tab.dataset.compare);
  });
}
