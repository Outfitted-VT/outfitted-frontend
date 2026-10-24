export function renderChatView() {
  return `
    <div class="flex flex-col w-full relative">
      <!-- Friend Header Bar -->
      <div class="px-margin py-space-sm flex items-center justify-between bg-surface/90 backdrop-blur-md sticky top-0 z-20 border-b border-surface-container-high/60">
        <div class="flex items-center gap-space-sm min-w-0">
          <div class="relative flex-shrink-0">
            <img class="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-surface-container-high" alt="Camille Dupont" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQoBB-RfZtEW8iXc9uacvJEdj6fI2Oa2jG2Ym8XPpHIOSVXOCNR_DysIiUIABvzIoXS8lcSDLVZ9kfEzfh5z3Eqnv_XuAVg6zK8Bd7SzKqF0jKXVds8MOKElPpKLKGlmjMjZDrPcK2enaV7WBhA75_S7OIB4D5pHurP4a6FC9WzMYVBkBo0h2EfDtDciqsoZDOJsSmzCzR0TtdbKEkQ6dizTIF5vdr3zBxRien_0nGRddSM5ppy7hj" />
            <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-tertiary-fixed rounded-full ring-2 ring-surface flex items-center justify-center">
              <span class="w-1.5 h-1.5 bg-tertiary-container rounded-full animate-pulse"></span>
            </span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h2 class="font-title-ui text-body-md text-on-surface truncate font-semibold">Camille Dupont</h2>
              <span class="font-micro-mono text-[9px] uppercase tracking-wider text-secondary px-1.5 py-0.5 rounded-full bg-secondary-fixed/50 font-semibold">Pro Stylist</span>
            </div>
            <p class="font-label-sm text-on-surface-variant truncate">@camille.paris · <span class="text-tertiary-fixed-variant font-medium">In 3D Fitting Room</span></p>
          </div>
        </div>
        <div class="flex items-center gap-space-xs flex-shrink-0">
          <button type="button" aria-label="Style Camille" class="h-8 px-2.5 rounded-full bg-secondary text-on-secondary font-micro-mono text-[10px] uppercase font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm" data-open-style-friend>
            <span class="material-symbols-outlined text-[13px]">styler</span>
            <span>Style Her</span>
          </button>
          <button aria-label="Shared Lookbook Archive" class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors" id="btn-chat-archive" data-open-dorm-closet>
            <span class="material-symbols-outlined text-[19px]">folder_special</span>
          </button>
        </div>
      </div>

      <!-- Messages Thread -->
      <div class="px-margin flex-1 flex flex-col space-y-space-md py-space-md pb-44" id="chat-messages-container">
        <div class="flex items-center justify-center my-space-xs">
          <div class="bg-surface-container-high/70 text-on-surface-variant px-3 py-1 rounded-full font-micro-mono text-[10px] tracking-widest uppercase">
            Today · 6:42 PM
          </div>
        </div>

        <!-- Camille Message 1 -->
        <div class="flex items-end gap-2 max-w-[85%] self-start">
          <img class="w-7 h-7 rounded-full object-cover mb-1 ring-1 ring-surface-container" alt="Camille" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ5_DvCu1-DuxTRZLys1LsQiZkrxhFMv2Fe04fnAT5a2oDY-_Vp49hHR4FTG9hGLibdy36idfxVLn51nXnsQ9wB0fDzEf-hstdfwLobIYR7nWSzI9CyaCxL_bqSRha-SHBgtRSvVV_awaFYyW6jotYCLDfHC_jYPAINGLXhe04HfgBFIl7nrPw-Tx7DLcMURdjo8AvybbxaBIV1oDgm1-77k48KQZaXgYKHQDbDw2QUPy1p0E2Uf3v" />
          <div class="bg-surface-container-lowest text-on-surface px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-body-md leading-relaxed">
            Hey babe! Leaving in 20 min, tell me if this look works for the gallery opening? Sending the 3D card now 👇
          </div>
        </div>

        <!-- EMBEDDED RICH LIVE FIT CARD -->
        <div class="self-start w-full max-w-sm ml-9 transition-all duration-300">
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-outline-variant/30 flex flex-col gap-3">
            <div class="flex items-center justify-between pb-1">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-micro-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-primary text-on-primary">Look Dilemma #3</span>
                <span class="font-micro-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary-container font-semibold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span> Urgent
                </span>
              </div>
              <span class="font-label-sm text-on-surface-variant font-medium">Live Fit Card</span>
            </div>

            <!-- Card Visual Stage -->
            <div class="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-surface-container group cursor-pointer shadow-inner">
              <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="3D Fit Look" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvitqbYhC06rwROt68aWVSkxshRsI_XZMYku2E4UmlX47SZItmqMOO94sP2n8m6eqeefZRDi0_ZOAFDUhConWt8cr6MPFh7ugcv8X0kd-7htxkU0ZSr-5h0P-Kd3vdxVMAqPs8mTdod8BXI64k-M-9Z2cEEilQlXab8X22Ky4j3z0vheDo_2bQ0YEBIRRY_2k63dndHnXJ-v1u9lFEc2IkdQYs1GMa468aoTCG5zm_URYRRTaPzYc3" />
              <div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/20 pointer-events-none"></div>
              <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-secondary text-on-secondary px-2.5 py-1 rounded-full text-label-sm font-semibold shadow-md backdrop-blur-sm animate-pulse">
                <span class="material-symbols-outlined text-[14px]">view_in_ar</span>
                <span>3D View ⟳</span>
              </div>
              <div class="absolute top-3 right-3 bg-primary-container/80 backdrop-blur-md text-on-primary text-micro-mono px-2 py-1 rounded-md tracking-wider">
                LOOK ID 892-C
              </div>
              <div class="absolute bottom-3 inset-x-3 flex items-center justify-between text-on-primary text-label-sm bg-primary/40 backdrop-blur-md p-2 rounded-lg">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                  Paris Gallery Vernissage
                </span>
                <span class="font-mono text-[11px] text-surface-container-highest">18°C · Indoor</span>
              </div>
            </div>

            <!-- Swatches Strip -->
            <div class="flex items-center gap-2 py-1 overflow-x-auto no-scrollbar">
              <div class="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-full flex-shrink-0">
                <span class="w-3.5 h-3.5 rounded-full bg-[#111111] ring-1 ring-surface"></span>
                <span class="font-label-sm text-on-surface">Structured Wool Coat</span>
              </div>
              <div class="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-full flex-shrink-0">
                <span class="w-3.5 h-3.5 rounded-full bg-[#F5E6D3] ring-1 ring-outline/30"></span>
                <span class="font-label-sm text-on-surface">Champagne Satin</span>
              </div>
              <div class="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-full flex-shrink-0">
                <span class="w-3.5 h-3.5 rounded-full bg-[#1C1917] ring-1 ring-surface"></span>
                <span class="font-label-sm text-on-surface">Chunky Boots</span>
              </div>
            </div>

            <!-- Dilemma Prompt -->
            <div class="bg-surface-container-low p-3 rounded-xl">
              <p class="font-headline-md text-body-md text-on-surface italic leading-snug">
                “Is the satin skirt too dressed up with the chunky boots?”
              </p>
            </div>

            <!-- In-Chat Voting Section -->
            <div class="flex flex-col gap-2 pt-1" id="chat-voting-section">
              <div class="flex gap-2">
                <button class="flex-1 py-3 px-3 rounded-full bg-secondary text-on-secondary font-title-ui text-label-md flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform" id="chatVoteWear" data-chat-vote="wear">
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[17px]">check_circle</span>
                    <span>Wear it</span>
                  </span>
                  <span class="font-mono font-bold" id="chatWearPercent">67%</span>
                </button>
                <button class="flex-1 py-3 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-title-ui text-label-md flex items-center justify-between active:scale-[0.98] transition-all" id="chatVoteRethink" data-chat-vote="rethink">
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[17px]">sync</span>
                    <span>Rethink</span>
                  </span>
                  <span class="font-mono text-on-surface-variant font-medium" id="chatRethinkPercent">33%</span>
                </button>
              </div>
              <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden flex">
                <div class="bg-secondary h-full transition-all duration-500" id="chatBarWear" style="width: 67%;"></div>
                <div class="bg-outline-variant h-full transition-all duration-500" id="chatBarRethink" style="width: 33%;"></div>
              </div>
            </div>

            <!-- Steal & Swap + 3D Room Actions -->
            <div class="pt-2 flex flex-col gap-2">
              <button type="button" class="w-full h-10 rounded-full bg-secondary text-on-secondary font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95" data-steal-swap-fit="office-evening">
                <span class="material-symbols-outlined text-[18px]">compare</span>
                <span>Steal & Swap (Compare on You)</span>
              </button>
              
              <button class="flex items-center justify-between px-1 text-on-surface group w-full text-left" id="btn-open-fit-in-3d">
                <span class="font-label-md text-secondary group-hover:underline flex items-center gap-1 font-semibold">
                  Tap to open in 3D Fitting Room
                  <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                </span>
                <span class="material-symbols-outlined text-outline-variant text-[18px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Your Sent Message -->
        <div class="flex items-end gap-2 max-w-[82%] self-end">
          <div class="bg-primary text-on-primary px-4 py-3 rounded-2xl rounded-br-sm shadow-sm text-body-md leading-relaxed">
            Obsessed with the silhouette! The contrast between the heavy coat and satin is insane. Definitely wear it.
          </div>
          <span class="material-symbols-outlined text-[15px] text-secondary mb-1" title="Delivered & Read">done_all</span>
        </div>

        <!-- Camille Reply -->
        <div class="flex items-end gap-2 max-w-[85%] self-start">
          <img class="w-7 h-7 rounded-full object-cover mb-1 ring-1 ring-surface-container" alt="Camille" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwmPdKR-pX5U1olk7pSSiZh_LEXf4aFt-VVM39P50HiGfrRwkk_SrWbEdhw3yWA9RJ2VEZnz3pN3uUk9DdIjj5CdsZjjTmhx7DPYWgWFSuvrz4IzGq16m1Bq93ppPxY6_GKYlYYJ_1fTalHjtV7c_xoaifHJemxwb5CM91iLNMxmUjfWEgDYl2CBCCYd6u0QHTFRlP8TgHFV0i4tvaVcKrY4UBCyWtAb4xLZ1NpdkI6NeZJ_h6zx6d" />
          <div class="bg-surface-container-lowest text-on-surface px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-body-md leading-relaxed">
            Ahhh thank god!! Swapping bag to the mini leather tote and heading out 🖤
          </div>
        </div>

        <div class="flex items-center gap-2 pl-9 self-start">
          <span class="bg-surface-container-high/60 text-on-surface-variant px-2.5 py-1 rounded-full text-label-sm font-micro-mono flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            Camille added a snapshot to Lookbook
          </span>
        </div>
      </div>

      <!-- Sticky Floating Bottom Input Bar -->
      <div class="fixed bottom-16 inset-x-0 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high/80 z-40 pb-safe pt-2">
        <!-- Quick Cue Reaction Pills -->
        <div class="px-margin mb-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span class="font-micro-mono text-[9px] uppercase tracking-wider text-outline px-1.5">Quick Cue:</span>
          <button class="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm shadow-sm flex-shrink-0 active:scale-95 transition-transform btn-chat-cue">
            🔥 10/10 silhouette
          </button>
          <button class="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm shadow-sm flex-shrink-0 active:scale-95 transition-transform btn-chat-cue">
            Try chunky loafers instead?
          </button>
          <button class="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm shadow-sm flex-shrink-0 active:scale-95 transition-transform btn-chat-cue">
            Proportions work perfectly!
          </button>
          <button class="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm shadow-sm flex-shrink-0 active:scale-95 transition-transform btn-chat-cue">
            Add a bold silver necklace ✨
          </button>
        </div>

        <!-- Main Input Form -->
        <form class="px-margin pb-3 flex items-center gap-2" id="chat-form">
          <button aria-label="Attach 3D Garment or Photo" class="w-11 h-11 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center flex-shrink-0 shadow-sm active:scale-95 transition-all" type="button">
            <span class="material-symbols-outlined text-[22px]">add_photo_alternate</span>
          </button>
          <div class="flex-1 relative flex items-center">
            <input class="w-full h-11 bg-surface-container-lowest rounded-full pl-4 pr-10 text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" id="chatInput" placeholder="Send feedback or suggest an item..." type="text" />
            <button aria-label="Send audio note" class="absolute right-2 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
              <span class="material-symbols-outlined text-[18px]">mic</span>
            </button>
          </div>
          <button aria-label="Send Message" class="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center flex-shrink-0 shadow-md active:scale-90 transition-transform" id="sendBtn" type="submit">
            <span class="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </form>
      </div>
    </div>
  `;
}
