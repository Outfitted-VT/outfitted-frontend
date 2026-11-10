import { currentUser } from "../data.js";
import { blurFaces, listFits, mediaUrl, uploadImage } from "../fits.js";
import { escapeHtml } from "../format.js";
import { postStory } from "../stories-api.js";
import { ofIcons, pillCta, switchInput } from "./components.js";
import { openSheet } from "./sheet.js";

const CAPTION_MAX = 200;
const VISIBILITY = [
  ["public", "Public"],
  ["close_friends", "Close friends"],
];

function formHtml() {
  const segs = VISIBILITY.map(([value, label], i) =>
    `<button type="button" class="of-seg ${i === 0 ? "on" : ""}" role="radio" aria-checked="${i === 0}" data-story-visibility="${value}">${label}</button>`
  ).join("");
  return `<div class="of-sheet-body of-form of-story-form">
    <button type="button" class="of-story-pick" data-story-pick>
      <span class="of-story-pick-empty">${ofIcons.image(24)}<span>Take or choose a photo</span></span>
      <img class="of-story-preview" alt="" hidden data-story-preview />
    </button>
    <input type="file" accept="image/*" hidden data-story-file />
    <label class="of-toggle-row">
      <span class="of-toggle-text"><b>Blur faces</b><small data-blur-note>Hide every face before you share.</small></span>
      ${switchInput({ label: "Blur faces", data: { "data-story-blur": true } })}
    </label>
    <label class="of-field-label">
      <span class="of-label-row">Caption<span class="of-counter" data-story-count>0 / ${CAPTION_MAX}</span></span>
      <textarea class="of-field of-textarea" rows="2" maxlength="${CAPTION_MAX}" placeholder="Where are you headed?" data-story-caption></textarea>
    </label>
    <div class="of-field-label">Link a fit
      <div data-story-fit-slot>${fitButton(null)}</div>
    </div>
    <div class="of-field-label">Who can see it
      <div class="of-segmented" role="radiogroup" aria-label="Who can see it">${segs}</div>
    </div>
  </div>
  <p class="of-toast-error" data-error hidden></p>
  ${pillCta({ label: "Share story", variant: "lime", disabled: true, data: { "data-story-share": true } })}`;
}

function fitThumb(fit) {
  const image = fit.images?.[0];
  return image ? `<img src="${escapeHtml(mediaUrl(image.url))}" alt="" />` : "";
}

function fitButton(fit) {
  if (!fit) return `<button type="button" class="of-menu-row" data-story-fit-open><span class="of-menu-icon">${ofIcons.sparkle(20)}</span>Pick one of your fits</button>`;
  return `<div class="of-linked-fit"><span class="of-linked-thumb">${fitThumb(fit)}</span>
    <span class="of-linked-name">${escapeHtml((fit.caption || "Untitled fit").split("\n")[0])}</span>
    <button type="button" class="of-icon-btn plain" data-story-fit-clear aria-label="Remove linked fit">${ofIcons.close(16)}</button></div>`;
}

async function pickWithCamera() {
  const camera = window.Capacitor?.isPluginAvailable?.("Camera") && window.Capacitor.Plugins?.Camera;
  if (!camera) return null;
  const photo = await camera.getPhoto({ source: "PROMPT", resultType: "uri", quality: 90, correctOrientation: true });
  const blob = await (await fetch(photo.webPath)).blob();
  return new File([blob], "story.jpg", { type: blob.type || "image/jpeg" });
}

function openFitPicker(onPick) {
  const { root, close } = openSheet({
    title: "Link a fit",
    body: `<div class="of-sheet-body" data-fit-list><p class="of-muted">Loading your fits…</p></div>`,
  });
  const list = root.querySelector("[data-fit-list]");
  const fits = new Map();
  listFits(`/users/${encodeURIComponent(currentUser.username)}/fits`, null, 30)
    .then((page) => {
      page.items.filter((fit) => fit.privacy_tier !== "vault").forEach((fit) => fits.set(fit.id, fit));
      list.innerHTML = fits.size
        ? [...fits.values()].map((fit) => `<button type="button" class="of-pick-fit" data-pick-fit="${fit.id}"><span class="of-linked-thumb">${fitThumb(fit)}</span><span class="of-linked-name">${escapeHtml((fit.caption || "Untitled fit").split("\n")[0])}</span></button>`).join("")
        : `<p class="of-muted">Post a fit first, then link it to a story.</p>`;
    })
    .catch(() => (list.innerHTML = `<p class="of-muted">Couldn't load your fits.</p>`));
  list.addEventListener("click", (event) => {
    const pick = event.target.closest("[data-pick-fit]");
    if (!pick) return;
    close();
    onPick(fits.get(pick.dataset.pickFit));
  });
}

export function openStoryComposer({ toast, onPosted = () => {} }) {
  const state = { file: null, previewUrl: null, uploaded: null, blurred: null, blur: false, fit: null, visibility: "public", busy: false };
  const { root, close } = openSheet({
    title: "Post a story",
    body: formHtml(),
    onClose: () => state.previewUrl && URL.revokeObjectURL(state.previewUrl),
  });
  const $ = (selector) => root.querySelector(selector);
  const share = $("[data-story-share]");
  const fileInput = $("[data-story-file]");

  const showError = (message) => {
    $("[data-error]").hidden = !message;
    $("[data-error]").textContent = message || "";
  };
  const refresh = () => (share.disabled = !state.file || state.busy);

  async function ensureUploaded() {
    state.uploaded ||= await uploadImage(state.file);
    return state.uploaded;
  }

  function setFile(file) {
    if (!file) return;
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    Object.assign(state, { file, previewUrl: URL.createObjectURL(file), uploaded: null, blurred: null });
    const preview = $("[data-story-preview]");
    preview.src = state.previewUrl;
    preview.hidden = false;
    $(".of-story-pick-empty").hidden = true;
    if (state.blur) applyBlur();
    showError("");
    refresh();
  }

  async function choosePhoto() {
    try {
      const file = await pickWithCamera();
      if (file) return setFile(file);
    } catch (err) {
      if (!/cancel/i.test(err?.message || "")) toast("Couldn't open the camera.");
      return;
    }
    fileInput.value = "";
    fileInput.click();
  }

  async function applyBlur() {
    const toggle = $("[data-story-blur]");
    const note = $("[data-blur-note]");
    if (!state.blur || !state.file || state.blurred) return;
    state.busy = true;
    refresh();
    note.textContent = "Blurring faces…";
    try {
      const original = await ensureUploaded();
      state.blurred = await blurFaces(original.id);
      $("[data-story-preview]").src = mediaUrl(state.blurred.url);
      note.textContent = "Faces blurred.";
    } catch (err) {
      state.blur = false;
      toggle.checked = false;
      note.textContent = err.message || "Couldn't blur faces.";
    }
    state.busy = false;
    refresh();
  }

  function setBlur(on) {
    state.blur = on;
    const preview = $("[data-story-preview]");
    if (!on && state.previewUrl) preview.src = state.previewUrl;
    if (on && state.blurred) preview.src = mediaUrl(state.blurred.url);
    $("[data-blur-note]").textContent = on && !state.file ? "Faces are blurred once you add a photo." : "Hide every face before you share.";
    applyBlur();
  }

  function setVisibility(value) {
    state.visibility = value;
    root.querySelectorAll("[data-story-visibility]").forEach((seg) => {
      const on = seg.dataset.storyVisibility === value;
      seg.classList.toggle("on", on);
      seg.setAttribute("aria-checked", String(on));
    });
  }

  function setFit(fit) {
    state.fit = fit;
    $("[data-story-fit-slot]").innerHTML = fitButton(fit);
  }

  async function submit() {
    if (!state.file || state.busy) return;
    state.busy = true;
    refresh();
    share.querySelector(".of-cta-label").textContent = "Sharing…";
    try {
      const image = state.blur && state.blurred ? state.blurred : await ensureUploaded();
      const caption = $("[data-story-caption]").value.trim() || null;
      const story = await postStory({ imageId: image.id, caption, fitId: state.fit?.id, visibility: state.visibility });
      close();
      toast("Story shared");
      onPosted(story);
    } catch (err) {
      showError(err.message || "Couldn't share your story.");
      share.querySelector(".of-cta-label").textContent = "Share story";
      state.busy = false;
      refresh();
    }
  }

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-story-pick]")) return choosePhoto();
    if (event.target.closest("[data-story-fit-open]")) return openFitPicker(setFit);
    if (event.target.closest("[data-story-fit-clear]")) return setFit(null);
    const seg = event.target.closest("[data-story-visibility]");
    if (seg) return setVisibility(seg.dataset.storyVisibility);
    if (event.target.closest("[data-story-share]")) submit();
  });
  fileInput.addEventListener("change", () => setFile(fileInput.files?.[0]));
  $("[data-story-blur]").addEventListener("change", (event) => setBlur(event.target.checked));
  $("[data-story-caption]").addEventListener("input", (event) => {
    $("[data-story-count]").textContent = `${event.target.value.length} / ${CAPTION_MAX}`;
  });
}
