// Modal View for Dorm Closet & Group Lookbooks (Event Coordination)

import { currentUser } from "../data.js";
import { escapeHtml } from "../format.js";

export function renderDormClosetModal(board, allBoards) {
  return `
    <div class="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-inverse-surface/60 backdrop-blur-md animate-fade-in" id="dorm-closet-backdrop">
      <div class="w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-surface-container-high/60 animate-slide-up relative">
        
        <!-- HEADER -->
        <header class="px-margin py-space-sm flex items-center justify-between border-b border-surface-container-high/60 bg-surface/90 backdrop-blur-md sticky top-0 z-20">
          <div class="flex items-center gap-space-xs min-w-0">
            <span class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[18px] text-tertiary-fixed">dry_cleaning</span>
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h2 class="font-title-ui text-title-ui font-semibold text-on-surface truncate">Dorm Closet & Lookbooks</h2>
                <span class="font-micro-mono text-[9px] uppercase tracking-wider text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-bold">Group Event</span>
              </div>
              <p class="font-label-sm text-on-surface-variant truncate">Coordinate fits, harmonize colors, & borrow pieces</p>
            </div>
          </div>
          <button type="button" aria-label="Close" class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 flex-shrink-0" data-close-dorm-closet>
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        <!-- BOARD SWITCHER TABS -->
        <div class="px-margin pt-space-xs pb-space-2xs bg-surface-container-low border-b border-surface-container-high/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          ${allBoards
            .map(
              (b) => `
            <button type="button" class="h-9 px-3.5 rounded-full font-label-md text-label-md font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 ${
              b.id === board.id
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }" data-board-tab="${escapeHtml(b.id)}">
              <span>${escapeHtml(b.title)}</span>
              <span class="w-2 h-2 rounded-full ${b.id === board.id ? "bg-tertiary-fixed" : "bg-outline-variant"}"></span>
            </button>
          `
            )
            .join("")}
          
          <button type="button" id="btn-open-create-board" class="h-9 px-3 rounded-full border border-dashed border-outline-variant text-secondary font-label-md text-label-md font-semibold whitespace-nowrap flex items-center gap-1 hover:bg-surface-container active:scale-95 transition-all flex-shrink-0">
            <span class="material-symbols-outlined text-[16px]">add</span>
            <span>New Board</span>
          </button>
        </div>

        <!-- SCROLLABLE CONTENT -->
        <div class="flex-1 overflow-y-auto px-margin py-space-sm space-y-space-md no-scrollbar">
          
          <!-- EVENT DETAILS HERO BANNER -->
          <div class="p-space-md rounded-2xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-surface-container-high/80 shadow-sm flex flex-col gap-2">
            <div class="flex items-start justify-between gap-space-xs">
              <div>
                <span class="font-micro-mono text-[10px] tracking-widest uppercase text-secondary font-bold">Event Lookbook</span>
                <h3 class="font-display-hero-mobile text-headline-md font-bold text-on-surface mt-0.5">${escapeHtml(board.title)}</h3>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-micro-mono text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm flex-shrink-0">
                <span class="material-symbols-outlined text-[13px]">groups</span>
                ${board.members.length} Friends
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-y-1 gap-x-3 text-label-sm text-on-surface-variant pt-1 border-t border-surface-container-high/50">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-secondary">calendar_today</span>
                ${escapeHtml(board.date)}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                ${escapeHtml(board.location)}
              </span>
            </div>

            <div class="bg-surface-container rounded-xl p-2.5 mt-1 flex items-start gap-2">
              <span class="material-symbols-outlined text-[18px] text-tertiary-fixed-variant mt-0.5">style</span>
              <div>
                <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Dress Code & Vibe</span>
                <p class="font-body-md text-label-md text-on-surface font-medium">${escapeHtml(board.theme)}</p>
              </div>
            </div>
          </div>

          <!-- PALETTE & CLASH HARMONIZER (The College Superpower!) -->
          <div class="p-space-sm bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-secondary">palette</span>
                <span class="font-title-ui text-label-md font-semibold text-on-surface">Vibe & Color Harmonizer</span>
              </div>
              <span class="font-micro-mono text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                ${board.harmonyScore}% Harmonized
              </span>
            </div>

            <p class="font-body-md text-[12px] text-on-surface-variant">
              Colors already claimed by friends. Outfitted warns you if you're about to accidentally twin!
            </p>

            <!-- Color Palette Strip -->
            <div class="grid grid-cols-5 gap-1.5 pt-1">
              ${board.palette
                .map(
                  (p) => `
                <div class="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                  <div class="w-7 h-7 rounded-full shadow-inner ring-1 ring-surface-container-highest" style="background-color: ${p.color};"></div>
                  <span class="font-micro-mono text-[8px] uppercase tracking-tight text-on-surface font-semibold text-center line-clamp-1">${escapeHtml(p.claimedBy)}</span>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="flex items-center gap-2 p-2 rounded-lg bg-tertiary-fixed/30 border border-tertiary-fixed text-[11px] text-on-surface font-medium">
              <span class="material-symbols-outlined text-[16px] text-tertiary-fixed-variant">verified</span>
              <span>Zero dress clashes detected. Color palette complements the venue lighting.</span>
            </div>
          </div>

          <!-- GROUP LOOKS FEED -->
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center justify-between px-1">
              <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-bold">Planned Group Fits (${board.fits.length})</span>
              <button type="button" id="btn-open-drop-fit" class="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-0.5 hover:underline">
                <span class="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Drop Your Fit</span>
              </button>
            </div>

            <div class="space-y-space-md">
              ${board.fits
                .map((fit) => {
                  const statusColors = {
                    locked: "bg-primary text-on-primary",
                    debating: "bg-secondary text-on-secondary",
                    "needs-shoes": "bg-tertiary-fixed text-on-tertiary-fixed"
                  };
                  return `
                <article class="bg-surface-container-lowest rounded-2xl p-space-sm border border-surface-container-high/60 shadow-sm flex flex-col gap-3">
                  <!-- User Header -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-space-xs">
                      ${
                        fit.author.avatar
                          ? `<img class="w-9 h-9 rounded-full object-cover ring-1 ring-surface-container-high" alt="${escapeHtml(fit.author.name)}" src="${escapeHtml(fit.author.avatar)}" />`
                          : `<div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-bold">${escapeHtml(fit.author.name.charAt(0))}</div>`
                      }
                      <div>
                        <span class="font-title-ui text-label-md font-semibold text-on-surface">${escapeHtml(fit.author.name)}</span>
                        <span class="font-micro-mono text-[10px] text-on-surface-variant block">@${escapeHtml(fit.author.username)}</span>
                      </div>
                    </div>
                    <span class="font-micro-mono text-[10px] px-2.5 py-1 rounded-full font-bold uppercase shadow-sm ${statusColors[fit.status] || "bg-surface-container text-on-surface"}">
                      ${escapeHtml(fit.statusText)}
                    </span>
                  </div>

                  <!-- Outfit Visual -->
                  <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container">
                    <img class="w-full h-full object-cover" alt="${escapeHtml(fit.title)}" src="${escapeHtml(fit.image)}" />
                    <div class="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-primary/75 backdrop-blur-md text-on-primary">
                      <h4 class="font-title-ui text-label-md font-semibold">${escapeHtml(fit.title)}</h4>
                      <p class="font-body-md text-[11px] text-surface-container-high italic line-clamp-1">“${escapeHtml(fit.notes)}”</p>
                    </div>
                  </div>

                  <!-- Pieces & Borrowing Actions -->
                  <div class="flex flex-col gap-1.5 pt-1">
                    <span class="font-micro-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Pieces in this fit:</span>
                    <div class="space-y-1.5">
                      ${fit.pieces
                        .map(
                          (piece) => `
                        <div class="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                          <div class="flex items-center gap-2 min-w-0">
                            <span class="w-3.5 h-3.5 rounded-full flex-shrink-0" style="background-color: ${piece.color};"></span>
                            <span class="font-label-md text-label-sm font-medium text-on-surface truncate">${escapeHtml(piece.name)} (${escapeHtml(piece.brand)})</span>
                          </div>
                          ${
                            piece.borrowable && fit.author.username !== currentUser.username
                              ? `
                            <button type="button" class="h-7 px-2.5 rounded-full bg-surface-container text-secondary font-micro-mono text-[10px] uppercase font-bold flex items-center gap-1 hover:bg-secondary hover:text-on-secondary transition-all active:scale-95 flex-shrink-0" data-borrow-item="${escapeHtml(piece.name)}" data-borrow-owner="${escapeHtml(fit.author.username)}">
                              <span class="material-symbols-outlined text-[13px]">swap_horiz</span>
                              <span>Borrow</span>
                            </button>
                            `
                              : piece.borrowable
                              ? `<span class="font-micro-mono text-[9px] text-secondary font-semibold">Available to borrow</span>`
                              : ""
                          }
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                  </div>
                </article>
              `;
                })
                .join("")}
            </div>
          </div>

        </div>

        <!-- STICKY BOTTOM ACTION: DROP MY FIT -->
        <footer class="p-margin border-t border-surface-container-high/80 bg-surface/95 backdrop-blur-xl flex items-center gap-space-xs">
          <button type="button" id="btn-open-drop-fit" class="flex-1 h-12 rounded-full bg-primary text-on-primary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[20px] text-tertiary-fixed">add_photo_alternate</span>
            <span>Drop My Fit to This Board</span>
          </button>
        </footer>

        <!-- SLIDE-OVER DRAWER: DROP YOUR FIT -->
        <div id="drop-fit-drawer" class="hidden absolute inset-0 z-30 bg-surface flex flex-col animate-slide-up">
          <header class="px-margin py-space-sm flex items-center justify-between border-b border-surface-container-high">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] text-secondary">add_circle</span>
              <h3 class="font-title-ui text-title-ui font-semibold text-on-surface">Drop Your Fit</h3>
            </div>
            <button type="button" id="btn-close-drop-fit" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </header>

          <form id="drop-fit-form" class="flex-1 overflow-y-auto p-margin space-y-space-md">
            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Fit Title / Look Name</span>
              <input type="text" id="drop-fit-title" placeholder="e.g. Burgundy Velvet Evening Blazer" class="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md" required />
            </label>

            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Status</span>
              <select id="drop-fit-status" class="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md">
                <option value="locked">Locked In 🔒 (Ready to wear)</option>
                <option value="debating">Debating 🤔 (Need opinions)</option>
                <option value="needs-shoes">Need Shoe / Accessory Advice 👠</option>
              </select>
            </label>

            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Primary Color (for Group Palette Harmonizer)</span>
              <div class="flex items-center gap-3">
                <input type="color" id="drop-fit-color" value="#831843" class="w-12 h-11 rounded-lg cursor-pointer bg-transparent border-0" />
                <span class="font-label-sm text-on-surface-variant">Tap to pick your main outfit shade</span>
              </div>
            </label>

            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Notes for Roommates / Friends</span>
              <textarea id="drop-fit-notes" rows="3" placeholder="e.g. Planning to wear gold jewelry, someone please let me know if anyone else has burgundy!" class="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md"></textarea>
            </label>

            <div class="pt-space-sm">
              <button type="submit" class="w-full h-12 rounded-full bg-primary text-on-primary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[18px] text-tertiary-fixed">check</span>
                <span>Post Fit to Lookbook</span>
              </button>
            </div>
          </form>
        </div>

        <!-- SLIDE-OVER DRAWER: CREATE NEW BOARD -->
        <div id="create-board-drawer" class="hidden absolute inset-0 z-30 bg-surface flex flex-col animate-slide-up">
          <header class="px-margin py-space-sm flex items-center justify-between border-b border-surface-container-high">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] text-secondary">create_new_folder</span>
              <h3 class="font-title-ui text-title-ui font-semibold text-on-surface">Create New Event Board</h3>
            </div>
            <button type="button" id="btn-close-create-board" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </header>

          <form id="create-board-form" class="flex-1 overflow-y-auto p-margin space-y-space-md">
            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Event Name</span>
              <input type="text" id="new-board-title" placeholder="e.g. Miami Spring Break Trip 🌴" class="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md" required />
            </label>

            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Dress Code / Theme</span>
              <input type="text" id="new-board-theme" placeholder="e.g. Resort Chic · Linen & Sunset Pastels" class="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md" required />
            </label>

            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Date & Time</span>
              <input type="text" id="new-board-date" placeholder="e.g. March 14–18" class="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md" required />
            </label>

            <label class="flex flex-col gap-1">
              <span class="font-label-md text-label-md font-semibold text-on-surface">Location</span>
              <input type="text" id="new-board-location" placeholder="e.g. South Beach" class="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-body-md" />
            </label>

            <div class="pt-space-sm">
              <button type="submit" class="w-full h-12 rounded-full bg-secondary text-on-secondary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[18px]">check</span>
                <span>Launch Board & Invite Friends</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `;
}
