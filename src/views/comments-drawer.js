export function renderCommentsDrawer() {
  return `
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 hidden" id="comments-drawer-backdrop">
      <div class="fixed inset-x-0 bottom-0 max-h-[92vh] bg-surface-container-lowest rounded-t-xl shadow-[0_-8px_30px_rgba(26,28,27,0.12)] flex flex-col overflow-hidden transition-transform duration-300 transform translate-y-full" id="comments-drawer-sheet">
        <!-- Drag Handle Indicator / Close Bar -->
        <div class="w-full flex justify-between items-center px-margin pt-space-sm pb-space-2xs cursor-pointer" id="comments-drawer-handle">
          <div class="w-8"></div>
          <div class="w-10 h-1 bg-surface-container-highest rounded-full"></div>
          <button class="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" id="btn-close-comments-drawer" aria-label="Close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Sheet Header -->
        <header class="px-margin pt-space-2xs pb-space-xs flex flex-col gap-space-xs border-b border-surface-container-high/40">
          <div class="flex items-baseline justify-between">
            <h2 class="font-headline-md text-headline-md text-on-surface tracking-tight" id="comments-drawer-title">
              Styling Feedback <span class="font-title-editorial text-title-editorial italic text-on-surface-variant ml-1" id="comments-drawer-count">(18 takes)</span>
            </h2>
            <span class="font-label-sm text-label-sm bg-surface-container text-on-surface px-space-xs py-0.5 rounded-full">
              Live
            </span>
          </div>

          <!-- Filter Chips Carousel -->
          <nav aria-label="Comment Filters" class="flex items-center gap-space-2xs overflow-x-auto py-space-2xs no-scrollbar">
            <button class="bg-primary text-on-primary px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-transform active:scale-95 btn-comment-filter" type="button" data-filter="all">
              All Takes (18)
            </button>
            <button class="bg-surface-container-low text-on-surface px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap hover:bg-surface-container transition-colors btn-comment-filter" type="button" data-filter="close">
              Close Friends (6)
            </button>
            <button class="bg-surface-container-low text-on-surface px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap hover:bg-surface-container transition-colors btn-comment-filter" type="button" data-filter="stylists">
              Stylists (3)
            </button>
            <button class="bg-secondary-fixed text-on-secondary-fixed px-space-sm py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap flex items-center gap-1 hover:bg-secondary-fixed-dim transition-colors btn-comment-filter" type="button" data-filter="wear">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              Wear it (14)
            </button>
          </nav>
        </header>

        <!-- Mini Sticky Post Recap Header -->
        <section class="mx-margin my-space-xs p-space-xs bg-surface-container-low rounded-DEFAULT flex items-center justify-between gap-space-sm">
          <div class="flex items-center gap-space-xs min-w-0">
            <img class="w-11 h-13 object-cover rounded-sm flex-shrink-0 bg-surface-container-high" alt="Post thumbnail" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJPbQGZ8Xks1a1HsIHm3bn5l7dO25nEigwgdu0wWou1TdUo1Fqa12FIJDwgb-jvnhKBbc2F18pqa-SBlaB5LfECPeS5IXfyDAE6rqaLXlT164Bso7nsK0JiSlES0DJZgrqtesgLhiE0X0iOduSDhWOI0gnSYcdfBimEK6d96iGjYRHzUzlUE55CodwtZlPTYI3uzg2Z5a-eyvG0C1_tdgidKd4-ss4kUntF3tCDc3uevHxqgL8KTVE" />
            <div class="flex flex-col min-w-0">
              <p class="font-title-ui text-label-md text-on-surface truncate" id="comments-recap-title">
                Oversized blazer for drinks in Soho?
              </p>
              <span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px] text-secondary">explore</span>
                Night Out • Spring Wardrobe
              </span>
            </div>
          </div>
          <div class="flex-shrink-0 flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-space-xs py-1 rounded-full shadow-sm">
            <span class="font-micro-mono text-micro-mono uppercase">68% Wear</span>
          </div>
        </section>

        <!-- Discussion Feed / Takes List -->
        <div class="flex-1 overflow-y-auto px-margin flex flex-col gap-space-md py-space-xs pb-36" id="comments-list-feed">
          <!-- Comment 1: Close Friend -->
          <article class="p-space-sm bg-surface-container-low rounded-DEFAULT flex flex-col gap-space-xs transition-shadow hover:shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <img class="w-9 h-9 rounded-full object-cover bg-surface-container" alt="Maya" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZjmksj5f-0LalpdttaZiDi_iNFNFK41-zZb4RxHN55d99aPzOLljcS0gWqxGJ1TZ2XmXPBjAvtJ0egRnHiCSIX21NAFxVUtys6vVZcf70TQufSVNI6mKCch00XZqgA-u17kxtqSEdDjwvIYKqk21tSqCFRXDhtZpe7HJDR1Gr4lsT9LFeRYUwJqzIw2hwedrPctmkz3xOqg2cwRIwfeG6Pfk2cdvtcOAwUkL58FRxdJAd2IAavalS" />
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="font-title-ui text-label-md text-on-surface font-semibold">@maya.lin</span>
                    <span class="bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-micro-mono px-1.5 py-0.5 rounded-full font-bold">
                      Close Friend
                    </span>
                  </div>
                  <span class="font-label-sm text-label-sm text-on-surface-variant">18m ago</span>
                </div>
              </div>
              <button aria-label="Comment options" class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
                <span class="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
            </div>
            <p class="font-body-md text-body-md text-on-surface mt-0.5 leading-relaxed">
              The cut of the shoulder gives it that Saint Laurent androgynous edge. Only note: roll the sleeves once to show the watch / wrist jewelry, balances the bulk.
            </p>
            <footer class="flex items-center justify-between pt-space-2xs mt-space-2xs text-on-surface-variant">
              <div class="flex items-center gap-space-sm">
                <button class="flex items-center gap-1 font-label-md text-label-md text-on-surface bg-surface-container-lowest px-space-xs py-1 rounded-full shadow-sm hover:bg-surface-variant transition-colors" type="button">
                  <span class="material-symbols-outlined text-[15px] text-secondary">arrow_drop_up</span>
                  <span>12 helpful</span>
                </button>
                <button class="font-label-md text-label-md hover:text-on-surface transition-colors" type="button">
                  Reply
                </button>
              </div>
              <span class="font-micro-mono text-micro-mono text-secondary tracking-widest uppercase font-semibold">Verified Fit</span>
            </footer>
          </article>

          <!-- Comment 2: Verified Stylist -->
          <article class="p-space-sm bg-surface-container-low rounded-DEFAULT flex flex-col gap-space-xs transition-shadow hover:shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <img class="w-9 h-9 rounded-full object-cover bg-surface-container" alt="Julian" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAX9PlLgPBvZNypv6CeqPqXXwCyyyRqKw6qYCVCGlPj4a24VQnWfSXDgGBqUuC6hN_ykTRvkAoLaSXaN1xehmctwzVI1SgJaFVrLbf6Wd5XL3JdgRbZ7Lbmt_n9UGGnVuq_Ff2kAAcyCGM9NyzPJxSGEqJwMVuqDM-bIPLhpHkqqt0of3Wr97dw1IfH-L_5SRhfOsXcw7RErG0q_ZkEkccEiV0dnSZGxM_qPdyl7FABTW1g9XjKO03Y" />
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="font-title-ui text-label-md text-on-surface font-semibold">@julian_stylist</span>
                    <span class="bg-primary text-on-primary font-micro-mono text-micro-mono px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                      <span class="material-symbols-outlined text-[11px] text-tertiary-fixed">verified</span>
                      Stylist
                    </span>
                  </div>
                  <span class="font-label-sm text-label-sm text-on-surface-variant">35m ago</span>
                </div>
              </div>
              <button aria-label="Comment options" class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
                <span class="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
            </div>
            <p class="font-body-md text-body-md text-on-surface mt-0.5 leading-relaxed">
              Proportions definitely work because the trousers have that crisp central crease. Keep the loafers, don't swap to chunky sneakers or it will look sloppy.
            </p>
            <footer class="flex items-center justify-between pt-space-2xs mt-space-2xs text-on-surface-variant">
              <div class="flex items-center gap-space-sm">
                <button class="flex items-center gap-1 font-label-md text-label-md text-on-surface bg-surface-container-lowest px-space-xs py-1 rounded-full shadow-sm hover:bg-surface-variant transition-colors" type="button">
                  <span class="material-symbols-outlined text-[15px] text-secondary">arrow_drop_up</span>
                  <span>24 helpful</span>
                </button>
                <button class="font-label-md text-label-md hover:text-on-surface transition-colors" type="button">
                  Reply
                </button>
              </div>
              <div class="flex items-center gap-1 text-on-surface-variant">
                <span class="material-symbols-outlined text-[14px]">tune</span>
                <span class="font-micro-mono text-micro-mono">3D Mesh Evaluated</span>
              </div>
            </footer>
          </article>

          <!-- Comment 3: Community Member -->
          <article class="p-space-sm bg-surface-container-low rounded-DEFAULT flex flex-col gap-space-xs transition-shadow hover:shadow-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <img class="w-9 h-9 rounded-full object-cover bg-surface-container" alt="Marcus" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsJOfhHPwckAuZdW_mwcKxFpwBYenu9EVvwZ7xZPT-K5mHEXbL_QBwElhlxzy79BxY1Fn8lOp9gOnfIR8l_XVqQdOLdHQr3w_VMeqSwtw3xcIpeCmk5RZjAPMPHsdwBdjNhlGitGHrrxkJo_nfhRX9Za1bOhxNp6pLQ5wUXQBAVy27G3le0CwNnuIzJEKm-WAU7jrAfSK6-TddkwDJ0LWf69CWJDMzEdvOLtsZzVgVmlWTIaYIwEp7" />
                <div class="flex flex-col">
                  <span class="font-title-ui text-label-md text-on-surface font-semibold">@marcus.t</span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant">52m ago</span>
                </div>
              </div>
              <button aria-label="Comment options" class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
                <span class="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
            </div>
            <p class="font-body-md text-body-md text-on-surface mt-0.5 leading-relaxed">
              I voted Rethink initially, but seeing it on the 3D model angle changed my mind. The side drape is super clean.
            </p>
            <footer class="flex items-center justify-between pt-space-2xs mt-space-2xs text-on-surface-variant">
              <div class="flex items-center gap-space-sm">
                <button class="flex items-center gap-1 font-label-md text-label-md text-on-surface bg-surface-container-lowest px-space-xs py-1 rounded-full shadow-sm hover:bg-surface-variant transition-colors" type="button">
                  <span class="material-symbols-outlined text-[15px] text-secondary">arrow_drop_up</span>
                  <span>4 helpful</span>
                </button>
                <button class="font-label-md text-label-md hover:text-on-surface transition-colors" type="button">
                  Reply
                </button>
              </div>
            </footer>
          </article>
        </div>

        <!-- Sticky Floating Comment Input Bar -->
        <aside class="absolute bottom-0 inset-x-0 bg-surface-container-lowest/95 backdrop-blur-xl px-margin pt-space-xs pb-safe shadow-[0_-12px_32px_rgba(26,28,27,0.08)] z-40 border-t border-surface-container-high/60">
          <!-- Quick-Reply Suggestion Pills -->
          <div class="flex items-center gap-space-2xs overflow-x-auto pb-space-xs no-scrollbar">
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Proportions work
            </button>
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Roll the sleeves
            </button>
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Try white sneakers
            </button>
            <button class="bg-surface-container text-on-surface px-space-sm py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform hover:bg-surface-container-high btn-critique-suggestion" type="button">
              Add a statement bag
            </button>
          </div>

          <!-- Main Input Form -->
          <form class="flex items-center gap-space-2xs bg-surface-container-low rounded-full p-1 pl-space-xs mb-space-2xs" id="critique-form">
            <button aria-label="Attach outfit piece or photo" class="w-9 h-9 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-variant transition-colors flex-shrink-0 shadow-sm" type="button">
              <span class="material-symbols-outlined text-[19px]">photo_camera</span>
            </button>
            <input class="bg-transparent flex-1 min-w-0 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none px-space-2xs py-1" id="critique-input" placeholder="Add your styling take or critique..." type="text" />
            <div class="flex items-center gap-1 flex-shrink-0 pr-1">
              <button aria-label="Record voice note critique" class="w-9 h-9 rounded-full text-on-surface-variant flex items-center justify-center hover:text-on-surface transition-colors" type="button">
                <span class="material-symbols-outlined text-[20px]">mic</span>
              </button>
              <button aria-label="Submit styling take" class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center transition-transform active:scale-90 hover:bg-primary/90 shadow-sm" type="submit">
                <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  `;
}
