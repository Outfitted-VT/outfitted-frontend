export function renderFeedView(posts = []) {
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

            <!-- Quick Vote Actions -->
            <div class="grid grid-cols-2 gap-2 mt-space-sm" id="vote-btn-group-a">
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
            <div class="pt-space-2xs">
              <button class="w-full h-9 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm" id="btn-cast-vote">
                <span>Cast Vote</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- MAIN FEED: FIT POST CARDS -->
      <section class="px-margin flex flex-col gap-space-lg mt-space-xs pb-space-2xl" id="feed-posts-container">
        <!-- Primary Post Card (Sophia Morin) -->
        <article class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm" id="post-sophia">
          <!-- Card Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high">
                <img class="w-full h-full object-cover" alt="Sophia Morin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0EJ2RawJ1m2ajLIuH5bJ7CCYMYZOUfZsi5vXfpx3DvTwa2zfuEqw5TPhhYwWCdzcgJAQ7BnH0sOtBdyu3UfgPwxHPsYwujMwu7y1KPdlkMrEozu40v0euswWtBzdON6vHetcZshVvWzev07Vmo6khGnZShcIrQJu8MqRrWkQzZ_OBEZbdkIpXKdQZ1ql7btTr3bAHK77YPL196-F6TyKdw0mtez4VAq7v6YyUvuMBzz3R0-VYMOGq" />
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-title-ui text-title-ui text-on-surface font-semibold">sophia.morin</span>
                  <span class="bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold">Close Friends</span>
                </div>
                <span class="font-micro-mono text-micro-mono text-on-surface-variant">42m ago · Paris, FR</span>
              </div>
            </div>
            <button aria-label="Post Options" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
              <span class="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>

          <!-- Fashion Dilemma Caption -->
          <div class="py-space-2xs">
            <p class="font-headline-md text-headline-md text-on-surface tracking-tight leading-snug">
              Oversized structured blazer for drinks in Soho? Or does it drown the proportions? Honest thoughts please!
            </p>
          </div>

          <!-- Look Board: Garment Pieces Gallery -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider font-semibold">Curated Look Pieces (4)</span>
              <span class="font-micro-mono text-micro-mono text-secondary font-semibold uppercase flex items-center gap-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> 3D Ready
              </span>
            </div>
            <div class="flex gap-gutter overflow-x-auto pb-space-xs -mx-space-md px-space-md no-scrollbar snap-x">
              <!-- Piece 1 -->
              <div class="min-w-[170px] max-w-[180px] snap-start bg-surface-container-low rounded p-2.5 flex flex-col justify-between">
                <div class="relative w-full aspect-square rounded-sm overflow-hidden bg-surface-container-high mb-2">
                  <img class="w-full h-full object-cover" alt="Blazer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5C6DNGoNbzbtNTqu2l6RRtDsQmJ7EaI6ioFvk2dvUbZI3PPd7b_oNwFhNLYhKfQF38bywZfB8TpvuommuIw9BwwY8i4ceaIKWivT8qPIAiNd55l5fy4iYi3mWBH7VaEXkYIVLIvSSgXLhtxWIC5JWeiWY2YoFQaFngxnm2LN5kZorFvpKut7ZM4u26ewOaw2Tpn-8AiDZsPcCwoqpa0s_KRNzY90sncZ_vZWi83-DZKUNs7t5TbBw" />
                  <span class="absolute top-1.5 left-1.5 bg-secondary text-on-secondary font-micro-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold">
                    3D Interactive
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#4B5563] inline-block shadow-sm"></span>
                    <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant tracking-wider">Slate Grey</span>
                  </div>
                  <h4 class="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">Tailored Blazer</h4>
                  <p class="font-micro-mono text-micro-mono text-on-surface-variant">Acne Studios</p>
                </div>
              </div>

              <!-- Piece 2 -->
              <div class="min-w-[170px] max-w-[180px] snap-start bg-surface-container-low rounded p-2.5 flex flex-col justify-between">
                <div class="relative w-full aspect-square rounded-sm overflow-hidden bg-surface-container-high mb-2">
                  <img class="w-full h-full object-cover" alt="Mockneck" src="https://lh3.googleusercontent.com/aida-public/AB6AXuClJq9OS41CFrAfwVqPoQ0z8W3HJ-E03I_kpviblt2R4mowt2rDK6DlRMM9i4-WaoZMh12zkfZ0LdEnYiwkB9xzWAQgMVeuvB6_1Yp09jAWLUgdqIbsO2efaOofZaHuu2CYecEC20h8LMVIppMRNbGejfyOPDf4upCQ-ZMdQtWvNsSWHsNQlhhkEuTclbdD8hUw33PsJNbY_Ls8T3aW82BLL7roVs1Mx0SBj8fXd4WoLk1QoF_Sj-TP" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#F9F8F6] inline-block shadow-sm"></span>
                    <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant tracking-wider">Ivory</span>
                  </div>
                  <h4 class="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">Ribbed Mockneck</h4>
                  <p class="font-micro-mono text-micro-mono text-on-surface-variant">Khaite</p>
                </div>
              </div>

              <!-- Piece 3 -->
              <div class="min-w-[170px] max-w-[180px] snap-start bg-surface-container-low rounded p-2.5 flex flex-col justify-between">
                <div class="relative w-full aspect-square rounded-sm overflow-hidden bg-surface-container-high mb-2">
                  <img class="w-full h-full object-cover" alt="Wool Trouser" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiAh3IJdNB08EJRNbYR38j_L8D2FEQ9I3zj3ZPW0-1G7LIHK_PP-aeScKFht3Tk4p151FBgcR0I4L6aSfVpcZWy6T6VnqvbWEPfDOa6qzMcg2zHpA1LhxTU5scbY92lOPW7DcHt_8dcgdUtVuIauTvKipCflqQa6oOzLLhakoxduduv0KerbJfsUQA1e25wcflSstV7GeXJmqnArjR3e87VyL9wH7SL_0MzpcwuYodoIdBpjCv8NQ7" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#2F3E2E] inline-block shadow-sm"></span>
                    <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant tracking-wider">Dark Olive</span>
                  </div>
                  <h4 class="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">Wool Wide Trouser</h4>
                  <p class="font-micro-mono text-micro-mono text-on-surface-variant">The Row</p>
                </div>
              </div>

              <!-- Piece 4 -->
              <div class="min-w-[170px] max-w-[180px] snap-start bg-surface-container-low rounded p-2.5 flex flex-col justify-between">
                <div class="relative w-full aspect-square rounded-sm overflow-hidden bg-surface-container-high mb-2">
                  <img class="w-full h-full object-cover" alt="Tassel Loafers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZeslQkRRWz9N-hNo4sxptcd5US2sBqBgkkJRXTJY_bOL_OB23uUUw50J9WVEviej1ndMQZvasLUkSquzUSzydnvKNXtd8G316f07lOipbK9Kr9cUfT9oMUZGVaQo1jnHNnmxxN0YN5X7xHfqPGR86zgFPAnOavIjeTxl-WoaispJn6nMOQj8hbsf1xe4rjPYdjX5NqVVcuKzNp5x7DDwWu05BUOGuMv55cjFfX_pPGFHVhez_WATU" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#111111] inline-block shadow-sm"></span>
                    <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant tracking-wider">Polished Calf</span>
                  </div>
                  <h4 class="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">Tassel Loafers</h4>
                  <p class="font-micro-mono text-micro-mono text-on-surface-variant">Jil Sander</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Binary Interactive Poll Widget -->
          <div class="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-space-xs mt-1">
            <div class="grid grid-cols-2 gap-2" id="binary-poll">
              <!-- Option Left: Wear it -->
              <button class="relative overflow-hidden group h-14 rounded bg-surface-container-lowest p-space-xs flex items-center justify-between text-left transition-all active:scale-[0.98]" data-poll-vote="wear" data-post-id="sophia">
                <div class="absolute inset-y-0 left-0 bg-secondary/15 rounded transition-all duration-700 ease-out" id="poll-wear-bar" style="width: 68%;"></div>
                <div class="relative z-10 flex flex-col">
                  <span class="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1">
                    <span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                    Wear it
                  </span>
                  <span class="font-micro-mono text-micro-mono text-secondary font-bold" id="poll-wear-text">68% majority</span>
                </div>
                <span class="relative z-10 font-headline-md text-headline-md text-on-surface font-semibold" id="poll-wear-num">68%</span>
              </button>

              <!-- Option Right: Rethink -->
              <button class="relative overflow-hidden group h-14 rounded bg-surface-container-lowest p-space-xs flex items-center justify-between text-left transition-all active:scale-[0.98]" data-poll-vote="rethink" data-post-id="sophia">
                <div class="absolute inset-y-0 left-0 bg-surface-container-high rounded transition-all duration-700 ease-out" id="poll-rethink-bar" style="width: 32%;"></div>
                <div class="relative z-10 flex flex-col">
                  <span class="font-label-md text-label-md font-semibold text-on-surface-variant">Rethink</span>
                  <span class="font-micro-mono text-micro-mono text-on-surface-variant">Proportions</span>
                </div>
                <span class="relative z-10 font-headline-md text-headline-md text-on-surface-variant font-medium" id="poll-rethink-num">32%</span>
              </button>
            </div>
            <div class="flex items-center justify-between px-1">
              <span class="font-micro-mono text-micro-mono text-on-surface-variant">84 total votes · Poll closes in 2h</span>
              <span class="font-micro-mono text-micro-mono text-secondary font-semibold cursor-pointer">Live Insights</span>
            </div>
          </div>

          <!-- Friend Discussion Bubble -->
          <div class="bg-surface-container rounded p-space-xs flex items-start gap-space-xs">
            <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5">
              <img class="w-full h-full object-cover" alt="Claire" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk-4YgUjeVcJM_ISE2LWlMYhuJzRTIGLCTLH_ArP1d1ezOXWVWBykCVMiiPd8SLg3UChEEqHF0MLfoHDCWRlGN1XdZmibkMakWOK2bi2FMu_lxU7_bf9XoOBZIhrg9w9DHagKVjy3gN_p5zXRnNcFNs-HXsbIPEeutg9z7Dk_7c_uLfjxhbglxzM6BuxSjMvEzF9Tg4i3t7fYyeIrPcbQ73mRhetRroXLDhA4Vgzp186zLIUX7KLMn" />
            </div>
            <div class="flex-1">
              <p class="font-body-md text-body-md text-on-surface leading-tight">
                <span class="font-semibold text-on-surface">@claire.st</span>
                The drape on the shoulder is chef's kiss! Definitely wear it with the loafers.
              </p>
              <button class="font-label-sm text-label-sm text-secondary font-semibold mt-1 hover:underline btn-open-comments" data-post-id="sophia">
                View all 18 styling takes →
              </button>
            </div>
          </div>

          <!-- Action Bar -->
          <div class="flex items-center justify-between pt-space-xs border-t-0">
            <div class="flex items-center gap-space-md">
              <!-- Heart -->
              <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors btn-toggle-like">
                <span class="material-symbols-outlined text-[20px] heart-icon">favorite</span>
                <span class="font-label-md text-label-md font-medium count-num">142</span>
              </button>
              <!-- Chat -->
              <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors btn-open-comments" data-post-id="sophia">
                <span class="material-symbols-outlined text-[20px]">chat_bubble</span>
                <span class="font-label-md text-label-md font-medium">18</span>
              </button>
              <!-- Bookmark -->
              <button class="text-on-surface-variant hover:text-on-surface transition-colors btn-toggle-bookmark">
                <span class="material-symbols-outlined text-[20px] bookmark-icon">bookmark</span>
              </button>
            </div>
            <!-- Share Pill -->
            <button class="h-8 px-3 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1 hover:bg-surface-container-high active:scale-95 transition-all btn-share-look" data-post-id="sophia">
              <span class="material-symbols-outlined text-[15px]">ios_share</span>
              Share Look
            </button>
          </div>
        </article>

        <!-- Secondary Editorial Look Preview (Marcus Vance) -->
        <article class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm" id="post-marcus">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high">
                <img class="w-full h-full object-cover" alt="Marcus" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh4tnn0ZGgLx4Wqe7xzu6SB3qOGdJRe0wuOC-Dlb8_iYmPRT5qFPMlN3ZGvE1TKo5g6uKMGRlpszF7GCk9LOGEe8Tffgg7kCzFVnqfVjNC3Rpr1W4wUMAEIa47AmJEYcR51v7aCh4owBgtq8wUEDQs5_Cgp5qUPAtmnvWx1AsOEtmZlMJVkxNOqjk7FQMTq6dOxaIGWu9RMmiaZh9zvg5zXKwq4ZXEZM9ilikNPB-nS9G_lU4A7Nx2" />
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-title-ui text-title-ui text-on-surface font-semibold">marcus.v</span>
                  <span class="bg-surface-container-high text-on-surface font-micro-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold">Look Archive</span>
                </div>
                <span class="font-micro-mono text-micro-mono text-on-surface-variant">2h ago · Milan</span>
              </div>
            </div>
            <button aria-label="Post Options" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>
          <p class="font-body-lg text-body-lg text-on-surface">
            Layering translucent silk organza over heavy raw denim for evening gallery walk. Texture contrast verdict?
          </p>
          <div class="w-full aspect-[4/5] rounded overflow-hidden bg-surface-container-high relative">
            <img class="w-full h-full object-cover" alt="Look" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxbH19S2aQnFvcxioxpDltJDXkVtavqjKe88w_U76sIsNMWpiZV0quweLgXDALKBxX7yN107PVAWpIzjNpOsuA7Z__Ro1oLlx6R1pZB0tn6d3Zioy36Sr3wFYKw0seIjhFOF7SY0QGVllZRMLJMrQ9DtjlVYvimzKRmhNDzoc1TqnEvw7xyTLFoZH0L0vxKGFdGmItL5X6mqxdP5kRM_MrvO-ZNiMtJ9OAFZYdxBN9CZ_lDXiIRBfO" />
            <!-- Interactive Hotspot Pill -->
            <div class="absolute bottom-3 left-3 bg-primary-container/85 backdrop-blur-md text-on-primary font-label-sm text-label-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <span>Tap to isolate garments</span>
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-space-2xs">
            <div class="flex items-center gap-space-md">
              <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors btn-toggle-like">
                <span class="material-symbols-outlined text-[20px] heart-icon">favorite</span>
                <span class="font-label-md text-label-md font-medium count-num">89</span>
              </button>
              <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors btn-open-comments" data-post-id="marcus">
                <span class="material-symbols-outlined text-[20px]">chat_bubble</span>
                <span class="font-label-md text-label-md font-medium">11</span>
              </button>
            </div>
            <button class="h-8 px-3 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1 hover:bg-surface-container-high active:scale-95 transition-all btn-share-look" data-post-id="marcus">
              <span class="material-symbols-outlined text-[15px]">ios_share</span>
              Share Look
            </button>
          </div>
        </article>
      </section>

      <!-- FLOATING CTA: POST A FIT DILEMMA -->
      <div class="fixed bottom-24 inset-x-0 z-40 pointer-events-none flex justify-center px-margin">
        <button class="pointer-events-auto h-12 px-5 rounded-full bg-primary text-on-primary font-title-ui text-title-ui flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-95 transition-transform duration-150" id="btn-floating-new-fit">
          <span class="material-symbols-outlined text-[20px] text-tertiary-fixed">add_circle</span>
          <span>Post a Fit Dilemma</span>
        </button>
      </div>
    </div>
  `;
}
