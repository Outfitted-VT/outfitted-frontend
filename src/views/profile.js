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

// A Peer Fashion Studio tile. Both tiles share this markup so their icon, title, and text line up.
// Padding is on the inner wrapper: styles.css resets button padding to 0.
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
    <div class="flex flex-col w-full px-margin space-y-space-md pb-8">
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

        <!-- Social Metrics Strip (filled in by main.js) -->
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
          <span>AI mode</span>
        </button>
      </section>

      <!-- Your fits (loaded by src/feed.js) -->
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
