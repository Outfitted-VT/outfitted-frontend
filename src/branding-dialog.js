import { icons } from "./icons.js";
import { brandIcons } from "./data.js";

export function renderBrandingDialog() {
  return `
    <dialog class="sheet sheet-medium" id="branding-dialog" aria-labelledby="branding-heading">
      <div class="sheet-card branding-card">
        <button type="button" class="icon-button close" id="close-branding-dialog" aria-label="Close">${icons.close}</button>
        <div class="branding-dialog-head">
          <p class="eyebrow" style="color:var(--brand-coral);">BRAND IDENTITY ✱</p>
          <h2 id="branding-heading">Outfitted Visual Suite</h2>
          <p class="sheet-lede">Explore authentic identity marks, monogram badges, and design concepts.</p>
        </div>

        <div class="brand-icons-grid" id="brand-icons-grid">
          ${brandIcons
            .map(
              (icon, idx) => `
              <div class="brand-icon-tile ${idx === 0 ? "selected" : ""}" data-icon-id="${icon.id}" data-icon-path="${icon.path}">
                <div class="icon-img-wrap">
                  <img src="${icon.path}" alt="${icon.label}" />
                </div>
                <span>${icon.label}</span>
              </div>
            `
            )
            .join("")}
        </div>

        <div class="loading-screen-trigger-box">
          <div>
            <strong>Interactive Splash Loading Screen</strong>
            <p>Preview the animated startup sequence with Didot serif typography and progress indicator.</p>
          </div>
          <button class="button button-outline" id="btn-trigger-splash">
            ${icons.rotate}<span>Play Splash Screen</span>
          </button>
        </div>
      </div>
    </dialog>

    <!-- Fullscreen Loading Splash Screen Overlay -->
    <div class="splash-screen-overlay" id="splash-overlay" hidden>
      <div class="splash-inner">
        <img src="./assets/branding/loading_screen.png" alt="Outfitted Loading" class="splash-logo-img" />
        <div class="splash-progress-track">
          <div class="splash-progress-fill" id="splash-fill"></div>
        </div>
        <p class="splash-status" id="splash-status-text">CALIBRATING YOUR WARDROBE...</p>
      </div>
    </div>
  `;
}

export function connectBrandingDialog() {
  const dialog = document.querySelector("#branding-dialog");
  const splash = document.querySelector("#splash-overlay");
  const splashFill = document.querySelector("#splash-fill");
  const splashStatus = document.querySelector("#splash-status-text");
  const btnTrigger = document.querySelector("#btn-trigger-splash");
  const closeBtn = document.querySelector("#close-branding-dialog");

  if (closeBtn) closeBtn.onclick = () => dialog.close();
  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.close();
  };

  // Switch active brand icon
  dialog.querySelectorAll(".brand-icon-tile").forEach((tile) => {
    tile.onclick = () => {
      dialog.querySelectorAll(".brand-icon-tile").forEach((t) => t.classList.remove("selected"));
      tile.classList.add("selected");
      const path = tile.dataset.iconPath;
      const navLogo = document.querySelector("#brand-header-icon");
      if (navLogo) navLogo.src = path;
    };
  });

  // Play splash screen
  function playSplash() {
    dialog.close();
    splash.hidden = false;
    splashFill.style.width = "0%";
    splashStatus.textContent = "SYNCHRONIZING FEED & CIRCLE...";

    setTimeout(() => {
      splashFill.style.width = "40%";
      splashStatus.textContent = "LOADING 3D PARAMETRIC AVATAR...";
    }, 400);

    setTimeout(() => {
      splashFill.style.width = "80%";
      splashStatus.textContent = "CURATING FRESH FITS...";
    }, 900);

    setTimeout(() => {
      splashFill.style.width = "100%";
      splashStatus.textContent = "WELCOME TO OUTFITTED ✱";
    }, 1400);

    setTimeout(() => {
      splash.hidden = true;
    }, 1800);
  }

  if (btnTrigger) btnTrigger.onclick = playSplash;
}
