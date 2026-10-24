// Modal View for Steal & Swap: Side-by-Side Body vs. Body Comparison

import { currentUser } from "../data.js";
import { escapeHtml } from "../format.js";

export function renderStealSwapModal(data, mode = "split") {
  const { friend, you, pieces, deltas } = data;

  return `
    <div class="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-inverse-surface/60 backdrop-blur-md animate-fade-in" id="steal-swap-backdrop">
      <div class="w-full sm:max-w-xl max-h-[92vh] flex flex-col bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-surface-container-high/60 animate-slide-up">
        
        <!-- MODAL HEADER -->
        <header class="px-margin py-space-sm flex items-center justify-between border-b border-surface-container-high/60 bg-surface/90 backdrop-blur-md sticky top-0 z-20">
          <div class="flex items-center gap-space-xs">
            <span class="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[18px]">compare</span>
            </span>
            <div>
              <div class="flex items-center gap-1.5">
                <h2 class="font-title-ui text-title-ui font-semibold text-on-surface">Steal & Swap</h2>
                <span class="font-micro-mono text-[9px] uppercase tracking-wider text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-bold">Body vs. Body</span>
              </div>
              <p class="font-label-sm text-on-surface-variant">How does @${escapeHtml(friend.username)}'s fit drape on you?</p>
            </div>
          </div>
          <button type="button" aria-label="Close" class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95" data-close-steal-swap>
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        <!-- SCROLLABLE BODY -->
        <div class="flex-1 overflow-y-auto px-margin py-space-sm space-y-space-md no-scrollbar">

          <!-- VIEW MODE SEGMENTED CONTROL -->
          <div class="flex items-center justify-between bg-surface-container-low p-1 rounded-full border border-surface-container-high/40">
            <button type="button" class="flex-1 h-9 rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all ${mode === "split" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}" data-swap-mode="split">
              <span class="material-symbols-outlined text-[17px]">splitscreen</span>
              <span>Split Slider</span>
            </button>
            <button type="button" class="flex-1 h-9 rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all ${mode === "side-by-side" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}" data-swap-mode="side-by-side">
              <span class="material-symbols-outlined text-[17px]">view_column</span>
              <span>Side-by-Side</span>
            </button>
          </div>

          <!-- COMPARISON STAGE -->
          ${
            mode === "split"
              ? `
            <!-- SPLIT SLIDER STAGE -->
            <div class="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-inner bg-surface-container select-none" id="steal-swap-stage" style="--swap-pos: 50%;">
              <!-- Right Side: You / Avatar (Bottom Layer) -->
              <img class="absolute inset-0 w-full h-full object-cover" alt="You wearing this fit" src="${escapeHtml(you.image)}" />
              
              <!-- Left Side: Friend (Clipped Top Layer) -->
              <div class="absolute inset-0 overflow-hidden" style="clip-path: inset(0 calc(100% - var(--swap-pos)) 0 0);">
                <img class="absolute inset-0 w-full h-full object-cover" alt="${escapeHtml(friend.name)} wearing this fit" src="${escapeHtml(friend.image)}" />
              </div>

              <!-- Draggable Divider Line -->
              <div class="absolute top-0 bottom-0 pointer-events-none z-10" id="steal-swap-divider" style="left: 50%; transform: translateX(-50%);">
                <div class="w-0.5 h-full bg-surface shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface shadow-lg border border-surface-container-high flex items-center justify-center text-on-surface">
                  <span class="material-symbols-outlined text-[18px]">code</span>
                </div>
              </div>

              <!-- Pill Labels -->
              <div class="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-primary/80 backdrop-blur-md text-on-primary px-3 py-1 rounded-full text-label-sm font-semibold shadow-md pointer-events-none">
                <span>Friend: @${escapeHtml(friend.username)}</span>
              </div>
              <div class="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-secondary/85 backdrop-blur-md text-on-secondary px-3 py-1 rounded-full text-label-sm font-semibold shadow-md pointer-events-none">
                <span>You: ${escapeHtml(you.height)}</span>
              </div>

              <!-- Interactive Slider Range Input -->
              <input type="range" min="5" max="95" value="50" class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" id="steal-swap-range" aria-label="Drag to compare friend vs your avatar" />

              <!-- Drag Helper Instruction at bottom -->
              <div class="absolute bottom-3 inset-x-4 z-10 flex items-center justify-between text-on-primary text-[11px] bg-primary/60 backdrop-blur-md py-1.5 px-3 rounded-full pointer-events-none">
                <span>◀ Slide to see friend</span>
                <span class="font-mono font-bold" id="steal-swap-percent">50% / 50%</span>
                <span>Slide to see you ▶</span>
              </div>
            </div>
            `
              : `
            <!-- SIDE-BY-SIDE DUAL VIEW -->
            <div class="grid grid-cols-2 gap-space-xs">
              <!-- Friend Card -->
              <div class="flex flex-col bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container-high/50 p-2">
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-container mb-2">
                  <img class="w-full h-full object-cover" alt="${escapeHtml(friend.name)}" src="${escapeHtml(friend.image)}" />
                  <span class="absolute top-2 left-2 bg-primary/80 backdrop-blur-md text-on-primary px-2 py-0.5 rounded-full font-micro-mono text-[9px] uppercase font-bold">Friend</span>
                </div>
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="font-title-ui text-label-md font-semibold text-on-surface truncate">${escapeHtml(friend.name)}</span>
                </div>
                <span class="font-micro-mono text-[10px] text-on-surface-variant">${escapeHtml(friend.height)} · Size ${escapeHtml(friend.sizeWorn)}</span>
                <p class="font-label-sm text-[11px] text-on-surface-variant mt-1 italic">“${escapeHtml(friend.fitVerdict)}”</p>
              </div>

              <!-- You Card -->
              <div class="flex flex-col bg-secondary-fixed/20 rounded-2xl overflow-hidden border border-secondary/30 p-2">
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-container mb-2">
                  <img class="w-full h-full object-cover" alt="You" src="${escapeHtml(you.image)}" />
                  <span class="absolute top-2 left-2 bg-secondary text-on-secondary px-2 py-0.5 rounded-full font-micro-mono text-[9px] uppercase font-bold">Your Avatar</span>
                </div>
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="font-title-ui text-label-md font-semibold text-on-surface truncate">You (@${escapeHtml(currentUser.username || "you")})</span>
                </div>
                <span class="font-micro-mono text-[10px] text-secondary font-bold">${escapeHtml(you.height)} · Rec. ${escapeHtml(you.sizeRecommended)}</span>
                <p class="font-label-sm text-[11px] text-on-surface-variant mt-1 italic">“${escapeHtml(you.fitVerdict)}”</p>
              </div>
            </div>
            `
          }

          <!-- BODY SPECIFICATION COMPARISON CARDS -->
          <div class="grid grid-cols-2 gap-space-xs p-space-xs bg-surface-container-low rounded-xl">
            <div class="flex flex-col p-2 bg-surface-container-lowest rounded-lg">
              <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant font-bold">Friend's Specs</span>
              <span class="font-title-ui text-body-md font-semibold text-on-surface mt-0.5">${escapeHtml(friend.height)}</span>
              <span class="font-label-sm text-[11px] text-on-surface-variant">${escapeHtml(friend.frame)}</span>
            </div>
            <div class="flex flex-col p-2 bg-surface-container-lowest rounded-lg border border-secondary/20">
              <span class="font-micro-mono text-[9px] uppercase text-secondary font-bold">Your Specs</span>
              <span class="font-title-ui text-body-md font-semibold text-on-surface mt-0.5">${escapeHtml(you.height)}</span>
              <span class="font-label-sm text-[11px] text-on-surface-variant">${escapeHtml(you.frame)}</span>
            </div>
          </div>

          <!-- PROPORTIONS & FIT DELTA ANALYSIS (Busting Returns) -->
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center justify-between px-1">
              <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-bold">Fit Delta & Drape Analysis</span>
              <span class="font-micro-mono text-[10px] text-secondary font-semibold">AI Fit Intelligence</span>
            </div>

            <div class="space-y-2">
              ${deltas
                .map(
                  (d) => `
                <div class="p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high/60 shadow-sm flex flex-col gap-1">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[17px] text-secondary">${escapeHtml(d.icon)}</span>
                      <span class="font-title-ui text-label-md font-semibold text-on-surface">${escapeHtml(d.metric)}</span>
                    </div>
                    <span class="font-micro-mono text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">${escapeHtml(d.badge)}</span>
                  </div>
                  <p class="font-body-md text-label-sm text-on-surface-variant leading-relaxed mt-0.5">${escapeHtml(d.description)}</p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- STEAL PIECES LIST -->
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center justify-between px-1">
              <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-bold">Steal Pieces From This Fit</span>
              <span class="font-micro-mono text-[10px] text-on-surface-variant">${pieces.length} items</span>
            </div>

            <div class="space-y-2">
              ${pieces
                .map(
                  (p) => `
                <div class="p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high/60 flex items-center justify-between gap-space-sm shadow-sm">
                  <div class="flex items-center gap-space-xs min-w-0">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: ${p.color}; border: 1px solid rgba(0,0,0,0.08);">
                      <span class="material-symbols-outlined text-[20px] text-primary/80">${escapeHtml(p.icon)}</span>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-title-ui text-label-md font-semibold text-on-surface truncate">${escapeHtml(p.name)}</span>
                      <span class="font-label-sm text-label-sm text-on-surface-variant truncate">${escapeHtml(p.brand)} · ${escapeHtml(p.price)}</span>
                      <span class="font-micro-mono text-[9px] text-secondary font-bold mt-0.5">${escapeHtml(p.recSize)}</span>
                    </div>
                  </div>
                  <button type="button" class="h-8 px-3 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1 hover:bg-surface-container-high active:scale-95 transition-all flex-shrink-0" data-steal-piece="${escapeHtml(p.name)}">
                    <span class="material-symbols-outlined text-[15px]">add</span>
                    <span>Steal</span>
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

        </div>

        <!-- STICKY ACTION FOOTER -->
        <footer class="p-margin border-t border-surface-container-high/80 bg-surface/95 backdrop-blur-xl flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-space-xs">
            <button type="button" id="btn-steal-entire-look" class="h-12 rounded-full bg-primary text-on-primary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
              <span class="material-symbols-outlined text-[18px] text-tertiary-fixed">content_copy</span>
              <span>Steal Full Fit</span>
            </button>
            <button type="button" id="btn-send-comparison-poll" class="h-12 rounded-full bg-secondary text-on-secondary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
              <span class="material-symbols-outlined text-[18px]">how_to_vote</span>
              <span>Poll Friends</span>
            </button>
          </div>
          <p class="text-center font-micro-mono text-[10px] text-on-surface-variant">
            Polls compare both silhouettes in your group chat to settle who wore it best.
          </p>
        </footer>

      </div>
    </div>
  `;
}
