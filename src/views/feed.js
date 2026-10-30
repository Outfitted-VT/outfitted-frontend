export function renderFeedView() {
  return `
    <div class="flex flex-col w-full">
      <!-- TODAY'S RADAR SECTION -->
      <section class="px-margin pt-space-xs pb-space-sm flex flex-col gap-space-xs">
        <div class="flex items-baseline justify-between">
          <div>
            <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-semibold">Today’s Radar</span>
            <h2 class="font-display-hero-mobile text-display-hero-mobile text-on-surface tracking-tight mt-0.5">What to wear today?</h2>
          </div>
          <span class="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80">Explore</span>
        </div>

        <!-- Horizontal Carousel -->
        <div class="flex gap-gutter overflow-x-auto pb-space-xs -mx-margin px-margin snap-x snap-mandatory no-scrollbar">
          <!-- Card A: Live Fit Card -->
          <article class="min-w-[300px] max-w-[320px] snap-center bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between transition-transform duration-200">
            <!-- Live Header -->
            <div class="flex items-center justify-between mb-space-xs">
              <div class="flex items-center gap-space-2xs">
                <span class="bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-micro-mono uppercase px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(208,240,67,0.7)]">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  Live Fit
                </span>
                <span class="font-label-md text-label-md text-on-surface font-semibold">@elena.v</span>
              </div>
              <span class="font-micro-mono text-micro-mono text-on-surface-variant">14m ago</span>
            </div>

            <!-- 3 Swatch Outfit Thumbnails -->
            <div class="grid grid-cols-3 gap-1.5 my-space-xs">
              <div class="bg-surface-container rounded p-1.5 flex flex-col items-center text-center">
                <div class="w-full aspect-square rounded-sm overflow-hidden mb-1 bg-surface-container-high">
                  <img class="w-full h-full object-cover" alt="Cashmere sweater" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5vGBduRjWuklHysHB7sezJFdT6dtSfjdsy91puvPrYpvFAZEMe4Qy4v8k6Y0hov9Iqg0-LfVFtrV6r05Krpg30ClxW-imXwt19OSpkdQdyQy17kuTikpLUoq7CXvAy4dQbTzBTILvEhI9IwLUyPKKyL1atf1ZILnAa0U-57RxsY7FX3i3j4iBSA0RNUKKLFWFgcHpfo_GyZJw0thy5-o_JQX-2pC8c-u__bvO7smNNlmhJqtskXY5" />
                </div>
                <span class="font-micro-mono text-[9px] uppercase tracking-tight text-on-surface line-clamp-1">Cashmere</span>
                <span class="font-micro-mono text-[8px] text-on-surface-variant">Oat</span>
              </div>
              <div class="bg-surface-container rounded p-1.5 flex flex-col items-center text-center">
                <div class="w-full aspect-square rounded-sm overflow-hidden mb-1 bg-surface-container-high">
                  <img class="w-full h-full object-cover" alt="Pleated trousers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCP8hU_ohU31fXg2UxqBIHgH2lSe9NBusuySLMrC4y0glAPeWQdqoQYo77ssbt-y8jxWFY-MVqcczESrfJz1_GqoZALwCIQYQgLM0dOzXEchywjPizZhW_fHG2IkUNrAVVo1-O1iy7XxiG-0V-8YLYzPJprjVIOz7azKpty9z3RQNyvfGc4LIP-kNk9vVwLB9dlP5SnIUl6kD_tOG7d2c7xdp3TTRS3G9IW2B2r8LmtEdtFYWJ20bp" />
                </div>
                <span class="font-micro-mono text-[9px] uppercase tracking-tight text-on-surface line-clamp-1">Trousers</span>
                <span class="font-micro-mono text-[8px] text-on-surface-variant">Charcoal</span>
              </div>
              <div class="bg-surface-container rounded p-1.5 flex flex-col items-center text-center">
                <div class="w-full aspect-square rounded-sm overflow-hidden mb-1 bg-surface-container-high">
                  <img class="w-full h-full object-cover" alt="Black loafers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjLunSpQZPGXeUoTqv40uyJmd3q6vF8O9VLPX8Tkgjq5-jba10Kb9YmHDLkIihmOxKubBs3yX8S6Za7J9qpuJr3T_WJWXTegh-oKa63BqdEpOtR9WGs-lzykheoU5xmXsGs1qYmOhOdat59CBqk_IMqECOOj5eBvPA801BZnbd6WQi2BuvzmwPC8OYUEYkfjpu9bS5aJwibvD6q8VwdpI_Jv-_NFpoD5LXnogAH82dRw35VEqfqFGG" />
                </div>
                <span class="font-micro-mono text-[9px] uppercase tracking-tight text-on-surface line-clamp-1">Loafers</span>
                <span class="font-micro-mono text-[8px] text-on-surface-variant">Black</span>
              </div>
            </div>

            <!-- Poll Progress -->
            <div class="mt-space-2xs">
              <div class="flex justify-between items-center mb-1">
                <span class="font-label-sm text-label-sm text-on-surface font-semibold" id="poll-a-status">75% say wear it</span>
                <span class="font-micro-mono text-micro-mono text-on-surface-variant" id="poll-a-count">12 votes</span>
              </div>
              <div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden flex">
                <div class="h-full bg-secondary rounded-full transition-all duration-500 ease-out" id="poll-a-bar" style="width: 75%"></div>
              </div>
            </div>

            <!-- AI mode (placeholder) -->
            <button type="button" class="w-full mt-space-2xs mb-1 h-8 rounded-full bg-secondary-fixed/60 hover:bg-secondary hover:text-on-secondary text-secondary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95" data-ai-mode>
              <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>AI mode</span>
            </button>

            <!-- Quick Vote Actions -->
            <div class="grid grid-cols-2 gap-2 mt-1" id="vote-btn-group-a">
              <button class="h-9 px-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all" data-quick-vote="wear">
                <span class="material-symbols-outlined text-[16px]">check</span>
                Wear it
              </button>
              <button class="h-9 px-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all" data-quick-vote="rethink">
                Rethink
              </button>
            </div>
          </article>

          <!-- Card B: Waiting On You Card -->
          <article class="min-w-[290px] max-w-[310px] snap-center bg-surface-container-low rounded-lg p-space-md shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-space-2xs">
                <span class="font-micro-mono text-micro-mono uppercase tracking-wider text-secondary font-bold">Needs Feedback</span>
                <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              </div>
              <h3 class="font-title-ui text-title-ui text-on-surface font-semibold">2 Fits Need Your Eye</h3>

              <!-- Avatar Stack + dilemma teaser -->
              <div class="flex items-center gap-2 mt-space-xs mb-space-sm">
                <div class="flex -space-x-2">
                  <div class="w-7 h-7 rounded-full bg-surface-container-highest overflow-hidden">
                    <img class="w-full h-full object-cover" alt="Friend avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBX0eROr5zPLPM_q-4-rfMs31l73q5Aj5YxXl49sgT8Au6hH17sdo6Z3Aw2BwC_ZYu8rezDXeqYIjAu5QWt_JfZEpWt7mRvHD6PNVVe8Ui8t5UsOMQJUtQ5VAZPl9xJyjPMVsIx7qFvgnW9avi3ClB0Mam9YqjFRliKtuae8AODQNrwNf_RjJ93sci2a2EByAq1WHNtJ4oojrjzeZtwwZ3GtpY42xqBoNQFZRvnRwJoJv9ZDKUP5v9_" />
                  </div>
                  <div class="w-7 h-7 rounded-full bg-surface-container-highest overflow-hidden">
                    <img class="w-full h-full object-cover" alt="Friend avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHvgi6MHLnu0SW2ydau8iVxdjhzG2RLC0YMZV7aIxmLQCdEPxo4K8PFBR19KCc099OsUaovPAhKMkq_3gK-7_E3wTQW80tsPn0rS0WF1hVGIluXqbTQ5vyDSdKJdhbkPKSEXSRMMy9L429gizhE2lB7cbTVtulNBsDClS1HMNpCOvzHY9IdMKNHDhDFsUYzltirZIb2UwbgvPehdWjVZvO4rFfRVSrVS0DLlQ4Rhc0y_Lv3LCIOYFK" />
                  </div>
                </div>
                <span class="bg-surface-container-high text-on-surface font-micro-mono text-micro-mono px-2 py-0.5 rounded-full font-semibold">+2 others</span>
              </div>
              <div class="bg-surface-container-lowest rounded-md p-2.5 mb-space-xs">
                <p class="font-body-md text-body-md text-on-surface italic line-clamp-2">
                  “Date night at Balthazar — Trench coat or leather jacket?”
                </p>
              </div>
            </div>
            <div class="pt-space-2xs flex flex-col gap-1.5">
              <button class="w-full h-9 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm" id="btn-cast-vote">
                <span>Cast Vote</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button type="button" class="w-full h-8 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-all" data-open-style-friend>
                <span class="material-symbols-outlined text-[16px] text-secondary">styler</span>
                <span>Style Maya's Look</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- DORM CLOSET & GROUP LOOKBOOKS SECTION -->
      <section class="px-margin pt-space-xs pb-space-xs">
        <div class="p-space-md rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low border border-surface-container-high shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-[19px] text-tertiary-fixed">dry_cleaning</span>
              </span>
              <div>
                <span class="font-micro-mono text-[9px] uppercase tracking-wider text-secondary font-bold">Collaborative Closets</span>
                <h3 class="font-title-ui text-title-ui font-semibold text-on-surface">Dorm Closets & Lookbooks</h3>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-[9px] font-bold uppercase shadow-sm">Active Boards</span>
          </div>
          <p class="font-body-md text-label-md text-on-surface-variant leading-snug">
            Planning for <strong>Alpha Phi Formal</strong> or <strong>VT Game Day</strong>? Harmonize palettes, prevent accidental duplicate looks, and request to borrow clothes.
          </p>
          <div class="flex items-center gap-2 pt-1">
            <button type="button" class="flex-1 h-10 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all" data-open-dorm-closet>
              <span class="material-symbols-outlined text-[18px] text-tertiary-fixed">groups</span>
              <span>Open Event Boards</span>
            </button>
            <button type="button" class="h-10 px-4 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-95 transition-all" data-open-style-friend>
              <span class="material-symbols-outlined text-[18px] text-secondary">styler</span>
              <span>Style a Friend</span>
            </button>
          </div>
        </div>
      </section>

      <!-- MAIN FEED: REAL FITS (loaded by src/feed.js) -->
      <section class="px-margin flex flex-col gap-space-lg mt-space-xs pb-8" aria-label="Fits">
        <div class="flex items-baseline justify-between">
          <span class="font-micro-mono text-micro-mono uppercase tracking-widest text-on-surface-variant font-semibold">Latest fits</span>
        </div>
        <div class="flex flex-col gap-space-lg" id="feed-fits"></div>
        <div class="py-space-md flex justify-center" id="feed-status"></div>
        <div id="feed-sentinel" aria-hidden="true"></div>
      </section>
    </div>
  `;
}
