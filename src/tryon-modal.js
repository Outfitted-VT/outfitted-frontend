import { icons } from "./icons.js";
import { partnerProduct, posts } from "./data.js";

export function renderVirtualDressingRoomModal() {
  return `
    <dialog class="sheet sheet-tryon" id="virtual-dressing-dialog" aria-labelledby="tryon-heading">
      <div class="sheet-card tryon-card">
        <button type="button" class="icon-button close" id="close-dressing-room" aria-label="Close">${icons.close}</button>
        <div class="tryon-head">
          <p class="eyebrow" style="color:var(--brand-green);">THE VIRTUAL DRESSING ROOM ✱</p>
          <h2 id="tryon-heading">Try it on.</h2>
          <p class="sheet-lede">Add a full-body photo of yourself and a clear picture of a garment.</p>
        </div>

        <!-- Uploader State -->
        <div class="dressing-setup-view" id="dressing-setup-view">
          <div class="dressing-boxes-row">
            <!-- Box 1: User Photo -->
            <label class="tryon-dropzone" id="user-photo-box">
              <input type="file" id="user-photo-input" accept="image/*" hidden />
              <div class="tryon-dropzone-content" id="user-box-empty">
                <span class="tryon-box-icon">${icons.camera}</span>
                <strong id="user-box-label">Full body photo</strong>
                <small>Full body, clear lighting</small>
              </div>
              <img id="user-box-preview" src="./assets/tryon-2d/before.jpg" alt="Your reference photo" class="tryon-thumb-preview" />
            </label>

            <!-- Box 2: Garment Photo -->
            <label class="tryon-dropzone" id="garment-photo-box">
              <input type="file" id="garment-photo-input" accept="image/*" hidden />
              <div class="tryon-dropzone-content" id="garment-box-empty">
                <span class="tryon-box-icon">${icons.shirt}</span>
                <strong id="garment-box-label">Garment photo</strong>
                <small>Screenshot or product photo</small>
              </div>
              <img id="garment-box-preview" src="./assets/feed/jordan_fit.png" alt="Garment photo" class="tryon-thumb-preview" />
            </label>
          </div>

          <div class="garment-presets-row">
            <span>Quick presets:</span>
            <button type="button" class="preset-pill active" data-img="./assets/feed/jordan_fit.png" data-name="Forest Knit Cardigan">Forest Cardigan</button>
            <button type="button" class="preset-pill" data-img="./assets/feed/maya_fit.png" data-name="Oversized Denim Jacket">Denim Jacket</button>
            <button type="button" class="preset-pill" data-img="./assets/feed/alex_fit.png" data-name="Pink Striped Shirt">Pink Poplin</button>
            <button type="button" class="preset-pill" data-img="./assets/tryon-2d/after.jpg" data-name="Teal Run Tee">Teal Run Tee</button>
          </div>

          <button class="button button-primary button-block btn-start-diffusion" id="btn-run-tryon">
            ${icons.wand}<span>Generate virtual try-on</span>
          </button>
        </div>

        <!-- Generating / Loading State -->
        <div class="dressing-loading-view" id="dressing-loading-view" hidden>
          <div class="diffusion-spinner">
            <span class="spin-ring"></span>
            <span class="spin-icon">${icons.sparkleIcon}</span>
          </div>
          <h3>Making your look... 🪄</h3>
          <p class="diffusion-status-text" id="diffusion-status-text">Conditioning diffusion latent tensor...</p>
          <div class="diffusion-bar"><span id="diffusion-progress"></span></div>
          <small>Aligning garment drape, preserving skin tone & fabric fold physics</small>
        </div>

        <!-- Generated Result View -->
        <div class="dressing-result-view" id="dressing-result-view" hidden>
          <div class="result-slider-container" id="tryon-slider-container">
            <div class="split-slider-wrapper">
              <img src="./assets/tryon-2d/after.jpg" alt="Generated Try-On Result" class="slider-img-after" id="tryon-result-img" />
              <div class="slider-overlay-before" id="slider-before-overlay">
                <img src="./assets/tryon-2d/before.jpg" alt="Original Reference Photo" class="slider-img-before" />
              </div>
              <div class="slider-handle" id="slider-split-handle">
                <span>◀ ▶</span>
              </div>
            </div>
            <div class="slider-labels">
              <span>Original Photo</span>
              <span>2D Diffusion Try-On Result</span>
            </div>
          </div>

          <div class="result-verdict-card">
            <div class="verdict-head">
              <div>
                <span class="verdict-tag">Fit Analysis Verdict</span>
                <h4 id="result-garment-title">Forest Knit Cardigan</h4>
              </div>
              <span class="score-badge">94% Fit Compatibility</span>
            </div>
            <div class="verdict-grid">
              <div><small>Shoulders</small><strong>Relaxed Drop</strong></div>
              <div><small>Torso Length</small><strong>True to Size</strong></div>
              <div><small>Drape & Tension</small><strong>Natural Fluid</strong></div>
            </div>
          </div>

          <div class="dressing-result-actions">
            <button class="button button-outline" id="btn-tryon-retry">Try Another Piece</button>
            <button class="button button-primary" id="btn-tryon-publish">
              ${icons.plus}<span>Post fit to Circle -></span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  `;
}

export function connectVirtualDressingRoom(onPublishedFit) {
  const dialog = document.querySelector("#virtual-dressing-dialog");
  if (!dialog) return;

  const closeBtn = dialog.querySelector("#close-dressing-room");
  const setupView = dialog.querySelector("#dressing-setup-view");
  const loadingView = dialog.querySelector("#dressing-loading-view");
  const resultView = dialog.querySelector("#dressing-result-view");
  const runBtn = dialog.querySelector("#btn-run-tryon");
  const retryBtn = dialog.querySelector("#btn-tryon-retry");
  const publishBtn = dialog.querySelector("#btn-tryon-publish");
  const garmentPreview = dialog.querySelector("#garment-box-preview");
  const garmentTitle = dialog.querySelector("#result-garment-title");
  const resultImg = dialog.querySelector("#tryon-result-img");
  const progressBar = dialog.querySelector("#diffusion-progress");
  const statusText = dialog.querySelector("#diffusion-status-text");

  let currentGarmentName = "Forest Knit Cardigan";
  let currentGarmentSrc = "./assets/feed/jordan_fit.png";

  if (closeBtn) {
    closeBtn.onclick = () => dialog.close();
  }

  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.close();
  };

  // Preset switching
  dialog.querySelectorAll(".preset-pill").forEach((pill) => {
    pill.onclick = () => {
      dialog.querySelectorAll(".preset-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentGarmentSrc = pill.dataset.img;
      currentGarmentName = pill.dataset.name;
      if (garmentPreview) garmentPreview.src = currentGarmentSrc;
    };
  });

  // Run generation
  if (runBtn) {
    runBtn.onclick = () => {
      setupView.hidden = true;
      loadingView.hidden = false;
      resultView.hidden = true;

      const steps = [
        { pct: "25%", text: "Segmenting reference body silhouette..." },
        { pct: "50%", text: "Extracting garment texture & warp mesh..." },
        { pct: "75%", text: "Diffusion denoising & lighting re-rendering..." },
        { pct: "100%", text: "Finalizing blend & composite..." },
      ];

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          progressBar.style.width = steps[stepIndex].pct;
          statusText.textContent = steps[stepIndex].text;
          stepIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            loadingView.hidden = true;
            resultView.hidden = false;
            garmentTitle.textContent = currentGarmentName;
            resultImg.src = currentGarmentSrc.includes("after")
              ? "./assets/tryon-2d/after.jpg"
              : currentGarmentSrc;
          }, 300);
        }
      }, 500);
    };
  }

  if (retryBtn) {
    retryBtn.onclick = () => {
      setupView.hidden = false;
      loadingView.hidden = true;
      resultView.hidden = true;
    };
  }

  // Interactive split slider
  const sliderContainer = dialog.querySelector("#tryon-slider-container");
  const beforeOverlay = dialog.querySelector("#slider-before-overlay");
  const splitHandle = dialog.querySelector("#slider-split-handle");

  if (sliderContainer && beforeOverlay && splitHandle) {
    let isDragging = false;
    const updateSlider = (clientX) => {
      const rect = sliderContainer.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0.05, Math.min(0.95, pos));
      const pct = pos * 100;
      beforeOverlay.style.width = `${pct}%`;
      splitHandle.style.left = `${pct}%`;
    };

    splitHandle.onmousedown = () => (isDragging = true);
    window.addEventListener("mouseup", () => (isDragging = false));
    window.addEventListener("mousemove", (e) => {
      if (isDragging) updateSlider(e.clientX);
    });

    sliderContainer.ontouchmove = (e) => {
      if (e.touches[0]) updateSlider(e.touches[0].clientX);
    };
  }

  if (publishBtn) {
    publishBtn.onclick = () => {
      dialog.close();
      if (onPublishedFit) {
        onPublishedFit({
          title: `Virtual Try-On: ${currentGarmentName}`,
          question: `Generated this look with Outfitted 2D Diffusion Try-On. Does this silhouette flatter?`,
          image: resultImg.src,
          pieces: currentGarmentName,
        });
      }
    };
  }
}

export function openVirtualDressingRoom(presetGarment) {
  const dialog = document.querySelector("#virtual-dressing-dialog");
  if (!dialog) return;

  const setupView = dialog.querySelector("#dressing-setup-view");
  const loadingView = dialog.querySelector("#dressing-loading-view");
  const resultView = dialog.querySelector("#dressing-result-view");
  if (setupView) setupView.hidden = false;
  if (loadingView) loadingView.hidden = true;
  if (resultView) resultView.hidden = true;

  if (presetGarment) {
    const garmentPreview = dialog.querySelector("#garment-box-preview");
    if (garmentPreview && presetGarment.image) garmentPreview.src = presetGarment.image;
  }

  dialog.showModal();
}
