import { currentUser, history } from "../data.js";

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function renderProfileView() {
  return `
    <div class="flex flex-col w-full px-margin space-y-space-md pb-36">
      <!-- Profile Header Card -->
      <section class="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col space-y-space-sm mt-space-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-space-sm">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-secondary/20 shadow-sm flex-shrink-0">
              <img class="w-full h-full object-cover" alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBdkI5tA3KwmZ4Zpg1UOO242PpvUP6lUoJcfyIaaz4nLFpF69LXtOt6emgVEW-0d6n46G5tOLaU_tpRSPOnLM3VLkXAeOddFzzr8x6C408zwKPLTtwpLWh5_k5P75XqMvQpXCWxMjU92qnWCv4lD3FKFd0vIVXyF3sUCbaDuGPNWs9P0TCrGAVexl8CLqZOFMogl0dLaThBZKVScxpf04hXjbLNAGYtR8r1vna5fCM3GfKKhxL61-g" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-1.5">
                <h2 class="font-title-ui text-headline-md text-on-surface font-semibold truncate">${escapeHtml(currentUser.name || "Sofoniyas")}</h2>
                <span class="material-symbols-outlined text-secondary text-[18px]">verified</span>
              </div>
              <p class="font-micro-mono text-micro-mono text-on-surface-variant uppercase tracking-wider">@${escapeHtml(currentUser.username || "sofoniyas")}</p>
            </div>
          </div>
          <button class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors" id="btn-profile-settings" aria-label="Settings">
            <span class="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>

        <p class="font-body-md text-body-md text-on-surface leading-snug">
          Archival tailoring & minimalist silhouettes. Testing drape and proportions before buying.
        </p>

        <!-- Social Metrics Strip -->
        <div class="flex items-center justify-around py-space-xs bg-surface-container-low rounded-DEFAULT text-center">
          <div>
            <div class="font-title-ui text-title-ui font-semibold text-on-surface">24</div>
            <div class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Fits Posted</div>
          </div>
          <div class="w-[1px] h-8 bg-surface-container-highest"></div>
          <div>
            <div class="font-title-ui text-title-ui font-semibold text-on-surface">14</div>
            <div class="font-micro-mono text-micro-mono text-secondary uppercase font-bold">Circle Friends</div>
          </div>
          <div class="w-[1px] h-8 bg-surface-container-highest"></div>
          <div>
            <div class="font-title-ui text-title-ui font-semibold text-on-surface">920</div>
            <div class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Followers</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-space-xs pt-1">
          <button class="h-10 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[17px] text-tertiary-fixed">group</span>
            <span>Close Friends</span>
          </button>
          <button class="h-10 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-95 transition-all" id="btn-profile-signout">
            <span class="material-symbols-outlined text-[17px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      <!-- History & Archive Section -->
      <section class="flex flex-col space-y-space-xs">
        <div class="flex items-center justify-between px-1">
          <span class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider font-semibold">Shared Fit History</span>
          <span class="font-micro-mono text-micro-mono text-secondary font-semibold cursor-pointer hover:underline">Filter Archive</span>
        </div>

        <div class="grid grid-cols-2 gap-space-xs">
          <!-- Item 1 -->
          <article class="bg-surface-container-lowest rounded-lg p-3 shadow-sm flex flex-col justify-between space-y-2">
            <div class="flex justify-between items-start">
              <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-micro-mono text-[9px] uppercase font-bold">Live</span>
              <span class="font-micro-mono text-[9px] text-on-surface-variant">Today</span>
            </div>
            <div>
              <h4 class="font-title-ui text-body-md font-semibold text-on-surface line-clamp-1">Weekend denim</h4>
              <p class="font-micro-mono text-micro-mono text-secondary font-bold">75% Wear it</p>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full bg-[#ede4d3]"></span>
              <span class="w-3 h-3 rounded-full bg-[#34466b]"></span>
              <span class="w-3 h-3 rounded-full bg-[#f7f5f0]"></span>
            </div>
          </article>

          <!-- Item 2 -->
          <article class="bg-surface-container-lowest rounded-lg p-3 shadow-sm flex flex-col justify-between space-y-2">
            <div class="flex justify-between items-start">
              <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-micro-mono text-[9px] uppercase font-bold">Saved</span>
              <span class="font-micro-mono text-[9px] text-on-surface-variant">Sep 21</span>
            </div>
            <div>
              <h4 class="font-title-ui text-body-md font-semibold text-on-surface line-clamp-1">Black overshirt</h4>
              <p class="font-micro-mono text-micro-mono text-on-surface-variant">88% Wear it</p>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full bg-[#111111]"></span>
              <span class="w-3 h-3 rounded-full bg-[#2b2926]"></span>
            </div>
          </article>

          <!-- Item 3 -->
          <article class="bg-surface-container-lowest rounded-lg p-3 shadow-sm flex flex-col justify-between space-y-2">
            <div class="flex justify-between items-start">
              <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-micro-mono text-[9px] uppercase font-bold">Saved</span>
              <span class="font-micro-mono text-[9px] text-on-surface-variant">Sep 14</span>
            </div>
            <div>
              <h4 class="font-title-ui text-body-md font-semibold text-on-surface line-clamp-1">Ribbed knit set</h4>
              <p class="font-micro-mono text-micro-mono text-on-surface-variant">92% Wear it</p>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full bg-[#c9a88a]"></span>
              <span class="w-3 h-3 rounded-full bg-[#7e1f2b]"></span>
            </div>
          </article>

          <!-- Item 4: Start New -->
          <button class="bg-surface-container-low rounded-lg p-3 shadow-sm flex flex-col items-center justify-center space-y-1.5 border border-dashed border-outline-variant text-center active:scale-95 transition-transform" id="btn-profile-new-fit">
            <span class="material-symbols-outlined text-[24px] text-secondary">add_circle</span>
            <span class="font-title-ui text-body-md font-semibold text-on-surface">New Look</span>
            <span class="font-micro-mono text-[9px] text-on-surface-variant">Ask circle</span>
          </button>
        </div>
      </section>
    </div>
  `;
}
