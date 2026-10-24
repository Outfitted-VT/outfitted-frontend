// Modal View for Style My Friend (Peer Styling Studio)

import { escapeHtml } from "../format.js";

export function renderStyleFriendModal(session, wardrobe) {
  const { friend, currentLook, stylistNote, activeCategory } = session;

  const categories = [
    { id: "tops", label: "Tops", icon: "apparel" },
    { id: "bottoms", label: "Bottoms", icon: "styler" },
    { id: "outerwear", label: "Outerwear", icon: "dry_cleaning" },
    { id: "shoes", label: "Shoes", icon: "steps" },
    { id: "accessories", label: "Accessories", icon: "diamond" }
  ];

  const currentPieces = Object.entries(currentLook)
    .filter(([_, item]) => Boolean(item))
    .map(([key, item]) => ({ key, ...item }));

  return `
    <div class="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-inverse-surface/60 backdrop-blur-md animate-fade-in" id="style-friend-backdrop">
      <div class="w-full sm:max-w-xl max-h-[94vh] flex flex-col bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-surface-container-high/60 animate-slide-up">
        
        <!-- HEADER -->
        <header class="px-margin py-space-sm flex items-center justify-between border-b border-surface-container-high/60 bg-surface/90 backdrop-blur-md sticky top-0 z-20">
          <div class="flex items-center gap-space-xs min-w-0">
            <span class="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[18px]">styler</span>
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h2 class="font-title-ui text-title-ui font-semibold text-on-surface truncate">Style @${escapeHtml(friend.username)}</h2>
                <span class="font-micro-mono text-[9px] uppercase tracking-wider text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-bold">Peer Stylist</span>
              </div>
              <p class="font-label-sm text-on-surface-variant truncate">Pick pieces & dress your friend's avatar</p>
            </div>
          </div>
          <button type="button" aria-label="Close" class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 flex-shrink-0" data-close-style-friend>
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        <!-- SCROLLABLE BODY -->
        <div class="flex-1 overflow-y-auto px-margin py-space-sm space-y-space-md no-scrollbar">

          <!-- FRIEND'S BRIEF CARD -->
          <div class="p-space-sm bg-surface-container-low rounded-2xl border border-surface-container-high/60 flex items-start gap-space-xs shadow-sm">
            <img class="w-11 h-11 rounded-full object-cover ring-2 ring-surface shadow-sm flex-shrink-0" alt="${escapeHtml(friend.name)}" src="${escapeHtml(friend.avatar)}" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <span class="font-title-ui text-label-md font-semibold text-on-surface">${escapeHtml(friend.name)}'s Styling Brief</span>
                <span class="font-micro-mono text-[9px] text-secondary font-bold">${escapeHtml(friend.height)} · ${escapeHtml(friend.size)}</span>
              </div>
              <p class="font-body-md text-label-sm text-on-surface italic mt-0.5">${escapeHtml(friend.brief)}</p>
            </div>
          </div>

          <!-- THE STYLING STAGE (AVATAR LOOK COMPOSER) -->
          <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container border border-surface-container-high/80 shadow-inner flex flex-col justify-between p-space-sm">
            <!-- Friend 3D Avatar Render in background -->
            <img class="absolute inset-0 w-full h-full object-cover opacity-90" alt="Friend avatar" src="${escapeHtml(friend.avatar)}" />
            <div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/40 pointer-events-none"></div>

            <!-- Top Overlay: Active Layers Count -->
            <div class="relative z-10 flex items-center justify-between">
              <span class="bg-primary/70 backdrop-blur-md text-on-primary font-micro-mono text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                ${currentPieces.length} Layers Styled
              </span>
              <span class="bg-surface-container-lowest/80 backdrop-blur-md text-on-surface font-micro-mono text-[10px] px-2 py-1 rounded-full font-semibold">
                Live Avatar Preview
              </span>
            </div>

            <!-- Bottom Overlay: Equipped Garment Badges -->
            <div class="relative z-10 flex flex-col gap-1.5">
              <span class="font-micro-mono text-[9px] uppercase tracking-wider text-surface-container-high font-bold">Currently On Avatar:</span>
              <div class="flex flex-wrap gap-1.5">
                ${
                  currentPieces.length
                    ? currentPieces
                        .map(
                          (item) => `
                        <div class="flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md pl-2 pr-1 py-1 rounded-full text-[11px] shadow-sm">
                          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color};"></span>
                          <span class="font-medium text-on-surface truncate max-w-[120px]">${escapeHtml(item.name)}</span>
                          <button type="button" class="w-4 h-4 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant" data-remove-layer="${escapeHtml(item.key)}" aria-label="Remove layer">
                            <span class="material-symbols-outlined text-[12px]">close</span>
                          </button>
                        </div>
                      `
                        )
                        .join("")
                    : `<span class="text-on-primary font-label-sm italic">Tap garments below to dress the avatar</span>`
                }
              </div>
            </div>
          </div>

          <!-- WARDROBE CATEGORY SELECTOR -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            ${categories
              .map(
                (c) => `
              <button type="button" class="h-9 px-3 rounded-full font-label-md text-label-md font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 ${
                activeCategory === c.id
                  ? "bg-secondary text-on-secondary shadow-sm"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }" data-style-category="${escapeHtml(c.id)}">
                <span class="material-symbols-outlined text-[16px]">${escapeHtml(c.icon)}</span>
                <span>${escapeHtml(c.label)}</span>
              </button>
            `
              )
              .join("")}
          </div>

          <!-- GARMENT SELECTION GRID -->
          <div class="grid grid-cols-2 gap-space-xs">
            ${(wardrobe[activeCategory] || [])
              .map((item) => {
                const singularCat = activeCategory === "accessories" ? "accessory" : activeCategory === "shoes" ? "shoes" : activeCategory.replace(/s$/, "");
                const isEquipped = currentLook[singularCat]?.id === item.id;
                return `
                <div class="p-3 rounded-2xl bg-surface-container-lowest border ${
                  isEquipped ? "border-secondary ring-2 ring-secondary/20 shadow-sm" : "border-surface-container-high/60"
                } flex flex-col justify-between gap-2 transition-all">
                  <div class="flex items-start justify-between">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner" style="background-color: ${item.color}; border: 1px solid rgba(0,0,0,0.08);">
                      <span class="material-symbols-outlined text-[18px] text-primary/80">${escapeHtml(item.icon)}</span>
                    </div>
                    ${
                      isEquipped
                        ? `<span class="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center"><span class="material-symbols-outlined text-[14px]">check</span></span>`
                        : ""
                    }
                  </div>
                  <div>
                    <h4 class="font-title-ui text-label-md font-semibold text-on-surface truncate">${escapeHtml(item.name)}</h4>
                    <span class="font-label-sm text-[11px] text-on-surface-variant block">${escapeHtml(item.brand)} · ${escapeHtml(item.price)}</span>
                  </div>
                  <button type="button" class="w-full h-8 rounded-full ${
                    isEquipped ? "bg-surface-container text-on-surface font-bold" : "bg-primary text-on-primary"
                  } font-label-sm text-[12px] flex items-center justify-center gap-1 active:scale-95 transition-all" data-equip-category="${escapeHtml(activeCategory)}" data-equip-garment="${escapeHtml(item.id)}">
                    <span>${isEquipped ? "Equipped" : "Put on Avatar"}</span>
                  </button>
                </div>
              `;
              })
              .join("")}
          </div>

          <!-- THE STYLIST'S ADVICE NOTE & VERDICT -->
          <div class="p-space-sm bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm flex flex-col gap-2">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px] text-secondary">rate_review</span>
              <span class="font-title-ui text-label-md font-semibold text-on-surface">Your Stylist Advice Note</span>
            </div>
            <p class="font-label-sm text-[11px] text-on-surface-variant">
              Tell ${escapeHtml(friend.name)} how to style and wear this (e.g. cuffing, tucking, footwear synergy):
            </p>
            <textarea id="stylist-advice-note" rows="3" class="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md leading-relaxed focus:outline-none focus:ring-2 focus:ring-secondary/40">${escapeHtml(stylistNote)}</textarea>
            
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="px-2.5 py-0.5 rounded-full bg-surface-container font-micro-mono text-[9px] uppercase font-bold text-on-surface-variant">#DateNightReady</span>
              <span class="px-2.5 py-0.5 rounded-full bg-surface-container font-micro-mono text-[9px] uppercase font-bold text-on-surface-variant">#CleanGirl</span>
              <span class="px-2.5 py-0.5 rounded-full bg-surface-container font-micro-mono text-[9px] uppercase font-bold text-on-surface-variant">#EffortlessTailoring</span>
            </div>
          </div>

        </div>

        <!-- STICKY ACTION FOOTER -->
        <footer class="p-margin border-t border-surface-container-high/80 bg-surface/95 backdrop-blur-xl flex flex-col gap-1.5">
          <button type="button" id="btn-send-styled-fit" class="w-full h-12 rounded-full bg-secondary text-on-secondary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[18px]">send</span>
            <span>Send Styled Fit to ${escapeHtml(friend.name)} ✨</span>
          </button>
          <span class="text-center font-micro-mono text-[10px] text-on-surface-variant">
            Delivers into ${escapeHtml(friend.name)}'s chat with an instant 3D Try-On invitation.
          </span>
        </footer>

      </div>
    </div>
  `;
}
