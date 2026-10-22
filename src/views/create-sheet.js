// The "+" sheet: post a fit, or try an outfit on. Screens are switched by src/create.js.

import { CATEGORIES } from "../fits.js";

const label = (text) =>
  `<span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-semibold">${text}</span>`;

const input =
  "w-full h-11 px-space-sm rounded-DEFAULT bg-surface-container-low text-on-surface font-body-md text-body-md border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all placeholder:text-on-surface-variant/60";

const primaryButton =
  "h-12 w-full rounded-full bg-primary text-on-primary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100";

const secondaryButton =
  "h-12 w-full rounded-full bg-surface-container text-on-surface font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all";

function menuScreen() {
  const option = (action, icon, title, text, accent) => `
    <button type="button" data-create-go="${action}"
      class="w-full text-left rounded-lg p-space-md flex items-center gap-space-md active:scale-[0.98] transition-transform ${accent}">
      <span class="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-container-lowest/15">
        <span class="material-symbols-outlined text-[28px]">${icon}</span>
      </span>
      <span class="flex flex-col gap-0.5">
        <span class="font-title-ui text-title-ui font-semibold">${title}</span>
        <span class="font-body-md text-body-md opacity-80">${text}</span>
      </span>
      <span class="material-symbols-outlined ml-auto opacity-70">arrow_forward</span>
    </button>`;
  return `
    <section data-screen="menu" class="flex flex-col gap-space-sm px-margin pb-space-xl">
      ${option("compose", "add_a_photo", "Post a fit", "Share photos of what you're wearing and tag each piece.", "bg-primary text-on-primary")}
      ${option(
        "tryon",
        "auto_awesome",
        "Try it on",
        "See an outfit on you before you buy it. Then post it if you love it.",
        "bg-surface-container-low text-on-surface border border-surface-container-high"
      )}
    </section>`;
}

function composeScreen() {
  const categoryChips = CATEGORIES.map(
    (c, i) => `
      <button type="button" data-item-category="${c.id}" aria-pressed="${i === 0}"
        class="item-chip flex-shrink-0 h-9 px-3 rounded-full flex items-center gap-1 font-label-md text-label-md transition-colors">
        <span class="material-symbols-outlined text-[16px]">${c.icon}</span>${c.label}
      </button>`
  ).join("");

  return `
    <form data-screen="compose" id="compose-form" class="hidden flex flex-col gap-space-lg px-margin pb-space-xl" novalidate>
      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center justify-between">
          ${label("Photos")}
          <span class="font-label-sm text-label-sm text-on-surface-variant" id="compose-photo-count">0 / 10</span>
        </div>
        <div class="flex gap-space-xs overflow-x-auto -mx-margin px-margin pb-1" id="compose-photos"></div>
        <input type="file" accept="image/*" multiple class="hidden" id="compose-file" />
      </div>

      <label class="flex flex-col gap-space-xs">
        <span class="flex items-center justify-between">
          ${label("Caption")}
          <span class="font-label-sm text-label-sm text-on-surface-variant" id="compose-caption-count">0 / 2200</span>
        </span>
        <textarea id="compose-caption" rows="3" maxlength="2200" placeholder="Where are you wearing it? What's the vibe?"
          class="${input} h-auto py-space-xs resize-none leading-relaxed"></textarea>
      </label>

      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center justify-between">
          ${label("Pieces")}
          <span class="font-label-sm text-label-sm text-on-surface-variant" id="compose-item-count">Tag what you're wearing</span>
        </div>
        <div class="flex flex-col gap-space-xs" id="compose-items"></div>

        <div class="flex flex-col gap-space-sm bg-surface-container-low rounded-lg p-space-sm hidden" id="item-editor">
          <div class="flex gap-space-xs overflow-x-auto -mx-space-sm px-space-sm pb-1">${categoryChips}</div>
          <input class="${input} bg-surface-container-lowest" id="item-name" maxlength="100" placeholder="What is it? e.g. Oversized denim jacket" />
          <div class="grid grid-cols-2 gap-space-xs">
            <input class="${input} bg-surface-container-lowest" id="item-brand" maxlength="100" placeholder="Brand (optional)" />
            <input class="${input} bg-surface-container-lowest" id="item-color" maxlength="50" placeholder="Color (optional)" />
          </div>
          <div class="flex gap-space-xs">
            <button type="button" id="item-cancel" class="h-10 px-4 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold">Cancel</button>
            <button type="button" id="item-add" class="h-10 flex-1 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold">Add piece</button>
          </div>
        </div>

        <button type="button" id="item-open"
          class="h-11 rounded-DEFAULT border border-dashed border-outline-variant text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[18px]">add</span>Add a piece
        </button>
      </div>

      <p id="compose-error" role="alert" class="hidden font-label-md text-label-md text-on-error-container bg-error-container rounded-DEFAULT px-space-sm py-space-xs"></p>

      <button type="submit" id="compose-submit" class="${primaryButton}" disabled>Post fit</button>
    </form>`;
}

function tryonScreen() {
  const slot = (name, icon, title, hint) => `
    <button type="button" data-tryon-slot="${name}"
      class="tryon-slot relative rounded-lg overflow-hidden bg-surface-container-low border border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 text-center p-space-sm active:scale-[0.98] transition-transform">
      <img class="absolute inset-0 w-full h-full object-cover hidden" alt="" data-slot-preview />
      <span class="slot-empty flex flex-col items-center gap-1">
        <span class="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined text-[24px] text-secondary">${icon}</span>
        </span>
        <span class="font-title-ui text-label-md text-on-surface font-semibold">${title}</span>
        <span class="font-label-sm text-label-sm text-on-surface-variant font-normal">${hint}</span>
      </span>
      <span class="slot-filled hidden absolute bottom-2 inset-x-2 justify-between items-center">
        <span class="px-2 py-1 rounded-full bg-black/55 text-white font-label-sm text-label-sm backdrop-blur" data-slot-label>${title}</span>
        <span class="px-2 py-1 rounded-full bg-white/85 text-on-surface font-label-sm text-label-sm">Change</span>
      </span>
    </button>`;

  return `
    <section data-screen="tryon" class="hidden flex flex-col gap-space-md px-margin pb-space-xl">
      <p class="font-body-md text-body-md text-on-surface-variant">
        Pick a photo of you and a photo of the outfit. We'll put the outfit on you.
      </p>
      <div class="grid grid-cols-2 gap-space-sm">
        ${slot("person", "person", "You", "Clear, well-lit, ideally full-body")}
        ${slot("outfit", "apparel", "The outfit", "On its own, or worn by someone")}
      </div>
      <input type="file" accept="image/*" class="hidden" id="tryon-file" />
      <p class="flex items-start gap-1.5 font-label-sm text-label-sm text-on-surface-variant font-normal">
        <span class="material-symbols-outlined text-[16px]">info</span>
        Only use photos of yourself. The result is AI-generated and is labeled as an AI try-on if you post it.
      </p>
      <p id="tryon-error" role="alert" class="hidden font-label-md text-label-md text-on-error-container bg-error-container rounded-DEFAULT px-space-sm py-space-xs"></p>
      <button type="button" id="tryon-start" class="${primaryButton}" disabled>
        <span class="material-symbols-outlined text-[20px] text-tertiary-fixed">auto_awesome</span>Try it on
      </button>
    </section>`;
}

function loadingScreen() {
  return `
    <section data-screen="tryon-loading" class="hidden flex flex-col items-center gap-space-md px-margin pb-space-xl text-center">
      <div class="tryon-generating relative w-full max-w-[280px] rounded-lg overflow-hidden bg-surface-container-low" style="aspect-ratio: 4 / 5">
        <img class="absolute inset-0 w-full h-full object-cover" alt="" id="tryon-loading-person" />
        <div class="tryon-scan"></div>
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-title-ui text-title-ui text-on-surface font-semibold" id="tryon-step">Uploading your photos…</span>
        <span class="font-body-md text-body-md text-on-surface-variant">This usually takes 10–30 seconds.</span>
      </div>
    </section>`;
}

function resultScreen() {
  return `
    <section data-screen="tryon-result" class="hidden flex flex-col gap-space-md px-margin pb-space-xl">
      <div class="relative w-full rounded-lg overflow-hidden bg-surface-container-low" id="tryon-result-frame">
        <img class="w-full h-full object-cover" alt="You wearing the outfit (AI-generated)" id="tryon-result-image" />
        <img class="absolute inset-0 w-full h-full object-cover hidden" alt="Your original photo" id="tryon-before-image" />
        <span class="absolute top-3 left-3" id="tryon-result-badge"></span>
      </div>
      <div class="grid grid-cols-2 p-1 rounded-full bg-surface-container" role="tablist">
        <button type="button" role="tab" data-compare="after" aria-selected="true" class="compare-tab h-9 rounded-full font-label-md text-label-md font-semibold">Try-on</button>
        <button type="button" role="tab" data-compare="before" aria-selected="false" class="compare-tab h-9 rounded-full font-label-md text-label-md font-semibold">Original</button>
      </div>
      <button type="button" id="tryon-post" class="${primaryButton}">
        <span class="material-symbols-outlined text-[20px]">send</span>Post this fit
      </button>
      <div class="grid grid-cols-2 gap-space-xs">
        <button type="button" id="tryon-again" class="${secondaryButton}">
          <span class="material-symbols-outlined text-[18px]">refresh</span>Try again
        </button>
        <button type="button" id="tryon-new" class="${secondaryButton}">
          <span class="material-symbols-outlined text-[18px]">apparel</span>New outfit
        </button>
      </div>
    </section>`;
}

export function renderCreateSheet() {
  return `
    <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hidden" id="create-backdrop">
      <div class="create-sheet fixed inset-x-0 bottom-0 max-h-[94vh] bg-surface-container-lowest rounded-t-xl shadow-2xl overflow-y-auto translate-y-full transition-transform duration-300"
        id="create-sheet" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <div class="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur pt-space-xs pb-space-sm px-margin">
          <div class="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-space-sm"></div>
          <div class="flex items-center justify-between gap-space-xs">
            <button type="button" id="create-back" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors invisible" aria-label="Back">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <div class="text-center">
              <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-secondary block" id="create-kicker">Create</span>
              <h2 class="font-headline-md text-headline-md text-on-surface" id="create-title">What are we doing?</h2>
            </div>
            <button type="button" id="create-close" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors" aria-label="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        ${menuScreen()}
        ${composeScreen()}
        ${tryonScreen()}
        ${loadingScreen()}
        ${resultScreen()}
      </div>
    </div>`;
}
