export function renderCreateFitSheet() {
  return `
    <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 hidden" id="create-fit-backdrop">
      <div class="fixed inset-x-0 bottom-0 max-h-[94vh] bg-surface-container-lowest rounded-t-xl shadow-2xl overflow-y-auto transition-transform duration-300 transform translate-y-full" id="create-fit-sheet">
        <!-- Drag Handle Indicator / Top Bar -->
        <div class="flex justify-between items-center px-margin pt-space-xs pb-1">
          <button class="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-space-2xs px-1" type="button" id="btn-cancel-create-fit">
            Cancel
          </button>
          <div class="w-12 h-1.5 bg-surface-container-highest rounded-full transition-all"></div>
          <button class="flex items-center gap-1 font-label-md text-label-md text-on-surface bg-surface-container-low px-space-xs py-1 rounded-full hover:bg-surface-container transition-colors" type="button">
            <span>Drafts</span>
            <span class="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-semibold">1</span>
          </button>
        </div>

        <!-- Sheet Header -->
        <header class="text-center px-margin pt-1 pb-space-md">
          <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-secondary block">Look Dilemma #412</span>
          <h2 class="font-headline-md text-headline-md text-on-surface font-normal">New Fit Dilemma</h2>
        </header>

        <form class="flex flex-col gap-space-lg px-margin pb-12" id="create-fit-form">
          <!-- Title & Dilemma Textarea Inputs -->
          <div class="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-DEFAULT">
            <label class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider" for="fit-title">Occasion / Context</label>
            <input class="w-full bg-transparent font-title-ui text-title-ui text-on-surface placeholder:text-outline focus:outline-none py-0.5" id="fit-title" placeholder="Name this fit scenario..." type="text" value="Friday dinner look: Soho drinks" required />
            <div class="h-[1px] w-full bg-surface-container-highest my-space-2xs"></div>
            <div class="flex items-start justify-between">
              <label class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider" for="dilemma-prompt">The Question</label>
              <span class="font-label-sm text-label-sm text-secondary flex items-center gap-0.5 font-semibold">
                <span class="material-symbols-outlined text-[14px]">auto_awesome</span> Poll Ready
              </span>
            </div>
            <textarea class="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none resize-none leading-relaxed" id="dilemma-prompt" placeholder="What are you debating? Ask for specific piece swaps or silhouette feedback..." rows="3" required>Need quick consensus: Should I go with the oversized blazer or swap for the cropped leather bomber? First date!</textarea>
          </div>

          <!-- Audience Selector Pills -->
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]">lock</span>
                <span class="font-micro-mono text-micro-mono uppercase tracking-wider text-on-surface font-semibold">Share With</span>
              </div>
              <span class="font-label-sm text-label-sm text-on-surface-variant">Voting restricted</span>
            </div>

            <!-- Audience Segment Pills -->
            <div class="grid grid-cols-3 gap-space-xs" id="audience-selector-group">
              <button class="group relative flex flex-col items-center justify-center p-space-xs rounded-DEFAULT bg-primary text-on-primary shadow-sm text-left transition-all btn-audience-opt" type="button" data-audience="Circle">
                <div class="flex items-center gap-1 mb-0.5">
                  <span class="material-symbols-outlined text-[15px] text-tertiary-fixed">verified</span>
                  <span class="font-label-md text-label-md font-semibold tracking-tight">Circle (14)</span>
                </div>
                <span class="font-micro-mono text-micro-mono text-on-primary-fixed-variant opacity-80">Close Friends</span>
              </button>

              <button class="flex flex-col items-center justify-center p-space-xs rounded-DEFAULT bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-left btn-audience-opt" type="button" data-audience="Followers">
                <div class="flex items-center gap-1 mb-0.5">
                  <span class="material-symbols-outlined text-[15px] text-on-surface-variant">group</span>
                  <span class="font-label-md text-label-md font-medium">Followers</span>
                </div>
                <span class="font-micro-mono text-micro-mono text-on-surface-variant">920 stylist tier</span>
              </button>

              <button class="flex flex-col items-center justify-center p-space-xs rounded-DEFAULT bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-left btn-audience-opt" type="button" data-audience="Runway">
                <div class="flex items-center gap-1 mb-0.5">
                  <span class="material-symbols-outlined text-[15px] text-on-surface-variant">public</span>
                  <span class="font-label-md text-label-md font-medium">Runway</span>
                </div>
                <span class="font-micro-mono text-micro-mono text-on-surface-variant">Global explore</span>
              </button>
            </div>
          </div>

          <!-- Garment Piece Builder Section -->
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface font-bold">Garment Pieces</span>
                <span class="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-micro-mono text-micro-mono font-bold" id="pieces-count-badge">3 Added</span>
              </div>
              <button class="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1" type="button" id="btn-reorder-pieces">
                <span class="material-symbols-outlined text-[15px]">swap_vert</span> Reorder
              </button>
            </div>

            <!-- Piece Cards List -->
            <div class="flex flex-col gap-space-xs" id="creator-pieces-list">
              <!-- Item 1: Blazer with color swatch row -->
              <div class="p-space-sm bg-surface-container-low rounded-DEFAULT flex flex-col gap-space-xs hover:bg-surface-container transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-space-sm">
                    <div class="w-12 h-12 rounded bg-surface-container-highest overflow-hidden flex-shrink-0">
                      <img class="w-full h-full object-cover" alt="Blazer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCImjuJLUK--0VCuy63WVaF0_PIfraETBCBN5j5CVCruuhIfrBntGCdg4proZ0XThOljWjQeFVAApEFOaAlkAKXmFAu0od9gIZteul3dzv_wn81mxxhMoKzXEZCSMgA2wQHA80FdZPIqYMbyxCw8RZRVEq6TSXIw100ODuUaUevQO1aWbG17lLOZhu0Klwyj7Md4pBUhH3CSBtxvvSG-0WxejVIHWOsDUUlya3pJWc9LfIlxon0g8sf" />
                    </div>
                    <div class="flex flex-col min-w-0">
                      <div class="flex items-center gap-space-xs">
                        <span class="font-title-ui text-label-md text-on-surface truncate font-semibold">Structured Wool Blazer</span>
                        <span class="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-micro-mono text-micro-mono">Outer</span>
                      </div>
                      <p class="font-body-md text-label-sm text-on-surface-variant">Acne Studios • Size 48 (EU)</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button aria-label="Edit piece" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors" type="button">
                      <span class="material-symbols-outlined text-[18px]">tune</span>
                    </button>
                    <button aria-label="Remove piece" class="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 transition-colors" type="button">
                      <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>

                <!-- Color Palette Variant Picker for piece -->
                <div class="flex items-center justify-between pt-1 mt-0.5 border-t border-surface-container-highest/60">
                  <div class="flex items-center gap-2">
                    <span class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Tone: Slate</span>
                    <div class="flex items-center gap-1.5">
                      <button aria-label="Slate" class="w-4 h-4 rounded-full bg-[#4A5568] ring-2 ring-primary ring-offset-1" type="button"></button>
                      <button aria-label="Pinstripe Ink" class="w-4 h-4 rounded-full bg-[#1A1E24] hover:scale-110 transition-transform" type="button"></button>
                      <button aria-label="Sand Olive" class="w-4 h-4 rounded-full bg-[#8A8878] hover:scale-110 transition-transform" type="button"></button>
                      <button aria-label="Espresso" class="w-4 h-4 rounded-full bg-[#362B28] hover:scale-110 transition-transform" type="button"></button>
                    </div>
                  </div>
                  <span class="font-label-sm text-micro-mono text-secondary-container font-semibold">Primary Focus</span>
                </div>
              </div>

              <!-- Item 2: Silk High-Neck Top -->
              <div class="p-space-sm bg-surface-container-low rounded-DEFAULT flex items-center justify-between hover:bg-surface-container transition-colors">
                <div class="flex items-center gap-space-sm">
                  <div class="w-12 h-12 rounded bg-surface-container-highest overflow-hidden flex-shrink-0">
                    <img class="w-full h-full object-cover" alt="Silk Top" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4HL10FFOBPczOHBTKKpTu8vYhuOYEVnDkEmX85e5uSo1tnz_kodmhlWJB17BcUL-UxcjrhEEuYGggWHucvyEalGeQc6D_YYSkhZgKxrI_lvs05yleg7Qhe2iqLLNSDAG8xJ8lLE76g2nAZOIPCup7CmB0T4SquTgswMLdWsWl2N8heZDiU7UwBA0A5ohwufRqQl6eHcZjdCuz2KQWFLONCyMDQ_U7a2MYRRFSxLAEw0xta6m71KFi" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-space-xs">
                      <span class="font-title-ui text-label-md text-on-surface truncate font-semibold">Silk High-Neck Top</span>
                      <span class="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-micro-mono text-micro-mono">Base</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-body-md text-label-sm text-on-surface-variant">Totême</span>
                      <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#FFFDD0] border border-surface-container-highest"></span>
                      <span class="font-micro-mono text-micro-mono text-on-surface-variant">Cream</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button aria-label="Edit piece" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors" type="button">
                    <span class="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                  <button aria-label="Remove piece" class="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 transition-colors" type="button">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>

              <!-- Item 3: Relaxed Pleated Trouser -->
              <div class="p-space-sm bg-surface-container-low rounded-DEFAULT flex items-center justify-between hover:bg-surface-container transition-colors">
                <div class="flex items-center gap-space-sm">
                  <div class="w-12 h-12 rounded bg-surface-container-highest overflow-hidden flex-shrink-0">
                    <img class="w-full h-full object-cover" alt="Trouser" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPxBDOsSYJW_C4D4E2USd8S4v746Oh4Weq4JP-qC0W6o2qh5m78_5SIDs-wOPO5FZ1yU4g_dV5eMUVNf2nHGtpbEO6aMWXSulVEEuFY0ldhWusBifSeDGwxdob_BI51Y7U16DRM2iZaCu5QItxpw57_uGGxDYNxbLGBQJgypYxhev3OD1T4-m_9IiAKWGGCHVYBN70chaGAqqgNJg04Arup-3h9LJeHrfZdDXIwatHUkT6WS00Yzzb" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-space-xs">
                      <span class="font-title-ui text-label-md text-on-surface truncate font-semibold">Relaxed Pleated Trouser</span>
                      <span class="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-micro-mono text-micro-mono">Bottom</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-body-md text-label-sm text-on-surface-variant">The Row</span>
                      <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#2D3748]"></span>
                      <span class="font-micro-mono text-micro-mono text-on-surface-variant">Charcoal</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button aria-label="Edit piece" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors" type="button">
                    <span class="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                  <button aria-label="Remove piece" class="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 transition-colors" type="button">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Garment Action Bar Button -->
            <button class="w-full py-space-sm px-space-md rounded-DEFAULT bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all flex items-center justify-center gap-space-xs active:scale-[0.99]" type="button" id="btn-add-custom-piece">
              <span class="material-symbols-outlined text-[20px] text-secondary">add_circle</span>
              <span class="font-title-ui text-label-md">Add Piece from Wardrobe</span>
              <span class="text-on-surface-variant font-body-md mx-1">or</span>
              <span class="font-title-ui text-label-md text-secondary flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[16px]">photo_camera</span> 3D Scan
              </span>
            </button>
          </div>

          <!-- 3D Avatar Rendering Feature Switch -->
          <div class="p-space-md rounded-DEFAULT bg-surface-container-low flex items-center justify-between">
            <div class="flex items-center gap-space-sm">
              <div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <span class="material-symbols-outlined text-[22px]">view_in_ar</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-title-ui text-label-md text-on-surface font-semibold">Render on 3D Avatar</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-[9px] font-bold uppercase tracking-wider">Rig Ready</span>
                </div>
                <p class="font-body-md text-label-sm text-on-surface-variant">Friends can rotate & drape silhouettes in 360°</p>
              </div>
            </div>
            <!-- Interactive Switch -->
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input checked="" class="sr-only peer" id="avatar3d-toggle" type="checkbox" />
              <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
            </label>
          </div>

          <!-- Poll Expiration Duration Selector -->
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-[16px]">schedule</span>
              <span class="font-micro-mono text-micro-mono uppercase tracking-wider text-on-surface font-semibold">Consensus Window</span>
            </div>
            <div class="flex items-center gap-space-2xs bg-surface-container rounded-full p-0.5">
              <button class="px-space-xs py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs font-semibold btn-duration-opt" type="button" data-duration="2h">
                2 Hours (Urgent)
              </button>
              <button class="px-space-xs py-0.5 rounded-full text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm btn-duration-opt" type="button" data-duration="24h">
                24 Hours
              </button>
            </div>
          </div>

          <!-- Primary Action CTA -->
          <div class="pt-space-xs">
            <button class="w-full h-12 bg-primary text-on-primary rounded-full font-title-ui text-label-md font-semibold flex items-center justify-center gap-space-xs shadow-lg hover:opacity-95 active:scale-[0.98] transition-all" type="submit" id="btn-submit-fit-dilemma">
              <span>Publish Dilemma to Circle</span>
              <span class="font-micro-mono text-micro-mono px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-bold">14 Voters</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <p class="font-label-sm text-micro-mono text-center text-on-surface-variant pt-space-xs">
              Notifications triggered via private lockscreen widget
            </p>
          </div>
        </form>
      </div>
    </div>
  `;
}
