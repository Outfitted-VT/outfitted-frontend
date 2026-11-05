import { currentUser } from "../data.js";
import { mediaUrl } from "../fits.js";
import { escapeHtml } from "../format.js";

function avatar() {
  if (currentUser.avatarUrl) {
    return `<img class="w-full h-full object-cover" alt="" src="${escapeHtml(mediaUrl(currentUser.avatarUrl))}" />`;
  }
  return `<div class="w-full h-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-headline-md">${escapeHtml(currentUser.initial || "?")}</div>`;
}

const stat = (id, label) => `
  <div>
    <div class="font-title-ui text-title-ui font-semibold text-on-surface" id="${id}">–</div>
    <div class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">${label}</div>
  </div>`;

const divider = `<div class="w-[1px] h-8 bg-surface-container-highest"></div>`;

const studioTile = (icon, title, text, attr) => `
  <button type="button" ${attr}
    class="h-full w-full rounded bg-surface-container-low hover:bg-surface-container border border-surface-container-high text-left transition-colors active:scale-[0.98]">
    <span class="h-full flex flex-col items-start gap-1.5 p-space-sm">
      <span class="w-9 h-9 rounded-full bg-surface-container-lowest border border-surface-container-high flex items-center justify-center text-secondary flex-shrink-0">
        <span class="material-symbols-outlined text-[20px]">${icon}</span>
      </span>
      <span class="font-title-ui text-label-md font-semibold text-on-surface leading-tight mt-0.5">${title}</span>
      <span class="font-body-md text-[12px] leading-snug text-on-surface-variant line-clamp-2">${text}</span>
    </span>
  </button>`;

export function renderProfileView() {
  return `
    <div class="flex flex-col w-full px-margin space-y-space-md pb-12">
      <!-- Profile Header Card -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col space-y-space-sm mt-space-xs">
        <div class="flex items-center space-x-space-sm">
          <button type="button" class="relative group w-16 h-16 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-secondary/20 shadow-sm flex-shrink-0 cursor-pointer p-0 border-0" id="btn-profile-avatar" title="Change profile picture" aria-label="Change profile picture">
            ${avatar()}
            <span class="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="material-symbols-outlined text-[20px]">photo_camera</span>
            </span>
          </button>
          <input type="file" id="profile-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none;" />
          <div class="min-w-0">
            <h2 class="font-title-ui text-headline-md text-on-surface font-semibold truncate">${escapeHtml(currentUser.name)}</h2>
            <p class="font-micro-mono text-micro-mono text-on-surface-variant uppercase tracking-wider">@${escapeHtml(currentUser.username)}</p>
          </div>
        </div>

        ${currentUser.bio ? `<p class="font-body-md text-body-md text-on-surface leading-snug">${escapeHtml(currentUser.bio)}</p>` : ""}

        <!-- Social Metrics Strip -->
        <div class="flex items-center justify-around py-space-xs bg-surface-container-low rounded text-center">
          ${stat("profile-fit-count", "Fits")}
          ${divider}
          ${stat("profile-follower-count", "Followers")}
          ${divider}
          ${stat("profile-following-count", "Following")}
        </div>

        <div class="grid grid-cols-2 gap-space-xs pt-1">
          <button class="h-10 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all" id="btn-profile-new-fit">
            <span class="material-symbols-outlined text-[17px] text-tertiary-fixed">add_circle</span>
            <span>New fit</span>
          </button>
          <button class="h-10 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-95 transition-all" id="btn-profile-signout">
            <span class="material-symbols-outlined text-[17px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      <!-- Returns Saved & Impact Counter Dashboard -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm border-l-4 border-secondary">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-secondary">savings</span>
            <span class="font-title-ui text-label-md font-semibold text-on-surface">Returns Saved & Impact</span>
          </div>
          <span class="font-micro-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold" id="impact-badge-label">
            Smart Shopper
          </span>
        </div>
        <p class="font-body-md text-[12px] text-on-surface-variant leading-snug">
          Estimated financial & environmental waste eliminated by sizing validation and peer feedback before checkout.
        </p>

        <div class="grid grid-cols-3 gap-space-2xs text-center pt-1">
          <div class="p-2.5 rounded bg-surface-container-low flex flex-col items-center">
            <span class="font-headline-md text-headline-md font-bold text-secondary" id="impact-dollars-saved">$96</span>
            <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Dollars Saved</span>
          </div>
          <div class="p-2.5 rounded bg-surface-container-low flex flex-col items-center">
            <span class="font-headline-md text-headline-md font-bold text-on-surface" id="impact-trips-avoided">3</span>
            <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Trips Avoided</span>
          </div>
          <div class="p-2.5 rounded bg-surface-container-low flex flex-col items-center">
            <span class="font-headline-md text-headline-md font-bold text-on-surface" id="impact-co2-saved">14.2 kg</span>
            <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant">CO₂ Spared</span>
          </div>
        </div>
      </section>

      <!-- TrueSize Passport & Cross-Brand Translator -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm" id="passport-section">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">straighten</span>
            <span class="font-title-ui text-label-md font-semibold text-on-surface">TrueSize Passport</span>
          </div>
          <button type="button" class="text-secondary font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-0.5" id="btn-toggle-add-reference">
            <span class="material-symbols-outlined text-[15px]">add</span>
            <span>Add piece</span>
          </button>
        </div>

        <p class="font-body-md text-[12px] text-on-surface-variant leading-snug">
          Your calibrated baseline sizes from clothes you already own. We use these specs to map sizing across different vendors.
        </p>

        <!-- Benchmark reference garments list -->
        <div class="flex flex-col gap-1.5" id="passport-garments-list">
          <div class="flex items-center justify-between p-2 rounded bg-surface-container-low text-label-sm">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <strong>Levi's 501</strong>
              <span class="text-on-surface-variant">Bottom · 30W</span>
            </div>
            <span class="font-micro-mono text-[10px] text-secondary font-bold uppercase">Benchmark</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded bg-surface-container-low text-label-sm">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <strong>Zara Ribbed Tee</strong>
              <span class="text-on-surface-variant">Top · Medium</span>
            </div>
            <span class="font-micro-mono text-[10px] text-secondary font-bold uppercase">Benchmark</span>
          </div>
        </div>

        <!-- Add Reference Inline Drawer -->
        <div class="hidden p-3 rounded-lg bg-surface-container-low flex flex-col gap-2 mt-1" id="add-reference-form">
          <strong class="font-label-md text-on-surface">Add Well-Fitting Benchmark Piece</strong>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" id="ref-brand" placeholder="Brand (e.g. Levi's, Zara)" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
            <input type="text" id="ref-item-name" placeholder="Item Name (e.g. 501 Jeans)" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="ref-category" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface">
              <option value="top">Top</option>
              <option value="bottom" selected>Bottom</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
            </select>
            <input type="text" id="ref-size" placeholder="Size (e.g. M, 30W, 32L)" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="px-3 py-1.5 rounded-full text-label-sm font-semibold text-on-surface" id="btn-cancel-add-ref">Cancel</button>
            <button type="button" class="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-semibold" id="btn-save-reference">Save Piece</button>
          </div>
        </div>

        <!-- Cross-Brand Size Translator Tool -->
        <div class="p-3 rounded-lg bg-surface-container-low/70 border border-surface-container-high flex flex-col gap-2 mt-2">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[17px] text-secondary">swap_horizontal_circle</span>
            <strong class="font-label-md text-on-surface">Cross-Brand Size Translator</strong>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="translate-brand" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface">
              <option value="Aritzia">Aritzia</option>
              <option value="Uniqlo">Uniqlo</option>
              <option value="Everlane">Everlane</option>
              <option value="The Frankie Shop">The Frankie Shop</option>
              <option value="ASOS">ASOS</option>
              <option value="Reformation">Reformation</option>
            </select>
            <select id="translate-category" class="p-2 rounded bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface">
              <option value="top">Top</option>
              <option value="bottom" selected>Bottom</option>
              <option value="outerwear">Outerwear</option>
              <option value="dress">Dress</option>
            </select>
          </div>
          <button type="button" id="btn-run-translation" class="h-9 rounded-full bg-secondary text-on-secondary font-label-md font-semibold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">psychology</span>
            <span>Translate Size</span>
          </button>
          <div id="translate-result-box" class="hidden p-2.5 rounded bg-surface-container-lowest border border-secondary/30 flex flex-col gap-1 text-label-sm">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-on-surface">Recommended Size: <strong class="text-secondary" id="rec-size-output">Size 4 (S)</strong></span>
              <span class="font-micro-mono text-[9px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded-full font-bold" id="rec-confidence-output">94% Confidence</span>
            </div>
            <p class="text-[11px] text-on-surface-variant leading-snug" id="rec-notes-output">
              Based on your Levi's 30W reference, Aritzia bottoms run slightly narrow in the hip. Ordering a Size 4 ensures relaxed drape.
            </p>
          </div>
        </div>
      </section>

      <!-- Collaborative Fashion Hub -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-secondary">handshake</span>
            <span class="font-title-ui text-label-md font-semibold text-on-surface">Peer Fashion Studio</span>
          </div>
          <span class="font-micro-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">New</span>
        </div>

        <div class="grid grid-cols-2 gap-space-xs pt-1">
          ${studioTile("groups", "Dorm Closets", "Plan event looks & borrow pieces", "data-open-dorm-closet")}
          ${studioTile("styler", "Style a Friend", "Dress your friend's avatar", "data-open-style-friend")}
        </div>

        <button type="button" class="w-full h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-all active:scale-95" data-ai-mode>
          <span class="material-symbols-outlined text-[17px] text-secondary">auto_awesome</span>
          <span>Try this look</span>
        </button>
      </section>

      <!-- Your fits -->
      <section class="flex flex-col space-y-space-xs">
        <div class="flex items-center justify-between px-1">
          <span class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider font-semibold">Your fits</span>
        </div>
        <div class="flex flex-col gap-space-lg" id="profile-fits"></div>
        <div class="py-space-md flex justify-center" id="profile-status"></div>
        <div id="profile-sentinel" aria-hidden="true"></div>
      </section>
    </div>
  `;
}
